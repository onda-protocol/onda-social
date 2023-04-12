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

import { PROGRAM_ID } from "../../lib/anchor/provider";
import { IDL, OndaSocial } from "../../lib/anchor/idl";
import { DataV1, LeafSchemaV1, RestrictionType } from "../../lib/anchor/types";
import prisma from "../../lib/prisma";

const ixIds = IDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

console.log("Ix ids: ", ixIds);

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
  if (req.headers.authorization !== process.env.WEBHOOK_AUTH_TOKEN) {
    res.status(401).end();
    return;
  }

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
            const merkleTreeIndex = ixAccounts.findIndex(
              (account) => account.name === "merkleTree"
            );
            const forumConfigAddress = new web3.PublicKey(
              ix.accounts[forumConfigIndex]
            );
            const merkleTreeAddress = new web3.PublicKey(
              ix.accounts[merkleTreeIndex]
            );
            const buffer = Buffer.from(ixData.slice(8));
            const maxDepth = new BN(buffer.subarray(0, 4), "le");
            const totalCapacity = new BN(1).shln(maxDepth.toNumber());
            const restriction = program.coder.types.decode<RestrictionType>(
              "RestrictionType",
              buffer.subarray(8)
            );

            await prisma.forum.create({
              data: {
                id: merkleTreeAddress.toBase58(),
                config: forumConfigAddress.toBase58(),
                collection: restriction?.collection?.address?.toBase58(),
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
            const dataDecoded = program.coder.types.decode<DataV1>(
              "DataV1",
              buffer
            );
            const dataV1 = getDataV1Fields(dataDecoded);
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

            switch (dataV1.type) {
              case "TextPost":
              case "LinkPost":
              case "ImagePost": {
                const data = {
                  id: schemaV1.id.toBase58(),
                  forum: forumAddress,
                  author: schemaV1.author.toBase58(),
                  title: dataV1.title!,
                  body: dataV1.body,
                  url: dataV1.url,
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
                  parent: dataV1.parent?.toBase58(),
                  post: dataV1.post!.toBase58(),
                  body: dataV1.body!,
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

function getDataV1Fields(entryData: DataV1) {
  if (entryData.textPost) {
    return {
      type: "TextPost",
      title: entryData.textPost.title,
      body: entryData.textPost.body,
    };
  }

  if (entryData.linkPost) {
    return {
      type: "LinkPost",
      title: entryData.linkPost.title,
      url: entryData.linkPost.url,
    };
  }

  if (entryData.imagePost) {
    return {
      type: "ImagePost",
      title: entryData.imagePost.title,
      src: entryData.imagePost.src,
    };
  }

  if (entryData.comment) {
    return {
      type: "Comment",
      post: entryData.comment.post,
      parent: entryData.comment.parent,
      body: entryData.comment.body,
    };
  }

  throw new Error("Invalid entry data");
}
