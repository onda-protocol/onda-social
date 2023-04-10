import type { NextApiRequest, NextApiResponse } from "next";
import {
  web3,
  Wallet,
  AnchorProvider,
  Program,
  BN,
} from "@project-serum/anchor";
import base58 from "bs58";
import camelcase from "camelcase";
import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";

import { PROGRAM_ID } from "../../lib/anchor";
import { IDL, OndaSocial } from "../../lib/anchor/idl";
import {
  EntryData,
  LeafSchemaV1,
  RestrictionType,
} from "../../lib/anchor/types";
import prisma from "../../lib/prisma";

enum EntryType {
  TextPost = "TextPost",
  LinkPost = "LinkPost",
  ImagePost = "ImagePost",
  Comment = "Comment",
}

const ixIds = IDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

console.log("Ix ids: ", ixIds);

function getState<T>(state: unknown) {
  let formattedState;

  if (typeof state === "object" && state !== null) {
    formattedState = camelcase(Object.keys(state)[0], {
      pascalCase: true,
    }) as T;
  }

  return formattedState;
}

function genIxIdentifier(ixName: string) {
  const namespace = "global";
  const name = snakeCase(ixName);
  const preimage = `${namespace}:${name}`;
  return base58.encode(sha256.digest(preimage).slice(0, 8));
}

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);
const provider = new AnchorProvider(
  connection,
  new Wallet(web3.Keypair.generate()),
  AnchorProvider.defaultOptions()
);
const program = new Program<OndaSocial>(IDL, PROGRAM_ID, provider);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  for (const tx of req.body) {
    for (const ix of tx.instructions) {
      if (ix.programId === PROGRAM_ID.toBase58()) {
        const ixData = base58.decode(ix.data);
        const ixId = base58.encode(ixData.slice(0, 8));
        const ixName = ixIds.find((i) => i.id === ixId)?.name;
        console.log("Handling ix: ", ixName);
        const ixAccounts = IDL.instructions.find(
          (i) => i.name === ixName
        )?.accounts;

        if (ixName === undefined || ixAccounts === undefined) {
          throw new Error(`Unknown instruction: ${ixId}`);
        }

        switch (ixName) {
          case "initForum": {
            // Get forum address
            const forumConfigIndex = ixAccounts.findIndex(
              (account) => account.name === "forumConfig"
            );
            const forumAddress = new web3.PublicKey(
              ix.accounts[forumConfigIndex]
            );
            const buffer = Buffer.from(ixData.slice(8));
            const maxDepth = new BN(buffer.subarray(0, 4), "le");
            const totalCapacity = new BN(1).shln(maxDepth.toNumber());
            console.log("Total capacity: ", totalCapacity.toNumber());
            const restriction = program.coder.types.decode<RestrictionType>(
              "RestrictionType",
              buffer.subarray(8)
            );
            console.log("Restriction: ", restriction);
            await prisma.forum.create({
              data: {
                id: forumAddress.toBase58(),
                collection: restriction?.collection?.collection?.toBase58(),
                totalCapacity: totalCapacity.toNumber(),
              },
            });

            break;
          }

          case "addEntry": {
            // Get forum address
            const forumConfigIndex = ixAccounts.findIndex(
              (account) => account.name === "forumConfig"
            );
            const forumAddress = ix.accounts[forumConfigIndex];
            // Decode entry data
            const buffer = Buffer.from(ixData.slice(8));
            const entryDecoded = program.coder.types.decode<EntryData>(
              "EntryData",
              buffer
            );
            const content = getEntryFields(entryDecoded);
            // Decode schema event data
            const noopIx = ix.innerInstructions[0];
            const serializedSchemaEvent = noopIx.data;
            const schemaEvent = base58.decode(serializedSchemaEvent);
            const schemaEventBuffer = Buffer.from(schemaEvent.slice(8));
            const schemaEventDecoded = program.coder.types.decode(
              "LeafSchema",
              schemaEventBuffer
            );
            const schemaV1 = schemaEventDecoded["v1"] as LeafSchemaV1;
            if (schemaV1 === undefined) {
              throw new Error("Unknown schema version");
            }

            // Parse entry type
            const entryType = getState<EntryType>(schemaV1.entryType);
            if (entryType === undefined) {
              throw new Error(`Unknown entry type: ${schemaV1.entryType}`);
            }

            switch (entryType) {
              case "TextPost":
              case "LinkPost":
              case "ImagePost": {
                const data = {
                  id: schemaV1.id.toBase58(),
                  forum: forumAddress,
                  author: schemaV1.author.toBase58(),
                  title: content.title!,
                  body: content.body,
                  url: content.url,
                  createdAt: schemaV1.createdAt.toNumber(),
                  nonce: schemaV1.nonce.toNumber(),
                };
                console.log(data);
                await prisma.post.create({
                  data,
                });
                break;
              }

              case "Comment": {
                const data = {
                  id: schemaV1.id.toBase58(),
                  author: schemaV1.author.toBase58(),
                  createdAt: schemaV1.createdAt.toNumber(),
                  parent: content.parent?.toBase58(),
                  post: content.post!.toBase58(),
                  body: content.body!,
                  nonce: schemaV1.nonce.toNumber(),
                };
                console.log(data);
                // Decode entry data
                await prisma.comment.create({
                  data,
                });
              }
            }
          }

          default: {
            break;
          }
        }
      }
    }
  }

  res.status(200).end();
}

function getEntryFields(entryData: EntryData) {
  if (entryData.textPost) {
    return {
      title: entryData.textPost.title,
      body: entryData.textPost.body,
    };
  }

  if (entryData.linkPost) {
    return {
      title: entryData.linkPost.title,
      url: entryData.linkPost.url,
    };
  }

  if (entryData.imagePost) {
    return {
      title: entryData.imagePost.title,
      src: entryData.imagePost.src,
    };
  }

  if (entryData.comment) {
    return {
      post: entryData.comment.post,
      parent: entryData.comment.parent,
      body: entryData.comment.body,
    };
  }

  throw new Error("Invalid entry data");
}
