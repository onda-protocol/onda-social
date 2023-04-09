import type { NextApiRequest, NextApiResponse } from "next";
import { web3, Wallet, AnchorProvider, Program } from "@project-serum/anchor";
import { EntryType } from "@prisma/client";
import base58 from "bs58";
import camelcase from "camelcase";
import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";

import { PROGRAM_ID } from "../../lib/anchor";
import { IDL, OndaSocial } from "../../lib/anchor/idl";
import { LeafSchema, EntryData } from "../../lib/anchor/types";
import prisma from "../../lib/prisma";

const ixIds = IDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

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
      const ixData = base58.decode(ix.data);
      const ixId = base58.encode(ixData.slice(0, 8));
      const ixName = ixIds.find((i) => i.id === ixId)?.name;
      const ixAccounts = IDL.instructions.find(
        (i) => i.name === ixName
      )?.accounts;

      if (ixName === undefined || ixAccounts === undefined) {
        throw new Error(`Unknown instruction: ${ixId}`);
      }

      switch (ixName) {
        case "initForum": {
          break;
        }

        case "addEntry": {
          // Decode entry data
          const buffer = Buffer.from(ixData.slice(8));
          const entryDecoded = program.coder.types.decode(
            "EntryData",
            buffer
          ) as EntryData;
          // Decode schema event data
          const noopIx = ix.innerInstructions[0];
          const serializedSchemaEvent = noopIx.data;
          const schemaEvent = base58.decode(serializedSchemaEvent);
          const schemaEventBuffer = Buffer.from(schemaEvent.slice(8));
          const schemaEventDecoded = program.coder.types.decode(
            "LeafSchema",
            schemaEventBuffer
          ) as LeafSchema;
          const schemaV1 = schemaEventDecoded.v1;

          if (schemaV1 === undefined) {
            throw new Error("Unknown schema version");
          }

          // Get forum address
          const forumConfigIndex = ixAccounts.findIndex(
            (account) => account.name === "forumConfig"
          );
          const forumAddress = ix.accounts[forumConfigIndex];
          // Parse entry type
          // @ts-expect-error
          const entryType = getState<EntryType>(schemaV1.entryType);

          if (entryType === undefined) {
            // @ts-expect-error
            throw new Error(`Unknown entry type: ${schemaV1.entryType}`);
          }

          const { title, parent, content } = getEntryFields(entryDecoded);

          await prisma.entry.create({
            data: {
              id: schemaV1.id.toBase58(),
              forum: forumAddress,
              author: schemaV1.author.toBase58(),
              type: entryType,
              title: title,
              content: content,
              // @ts-expect-error
              createdAt: schemaV1.createdAt.toNumber(),
              nonce: schemaV1.nonce.toNumber(),
              parent: parent?.toBase58(),
            },
          });

          break;
        }

        default: {
          break;
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
      content: entryData.textPost.body,
    };
  }

  if (entryData.linkPost) {
    return {
      title: entryData.linkPost.title,
      content: entryData.linkPost.url,
    };
  }

  if (entryData.imagePost) {
    return {
      title: entryData.imagePost.title,
      content: entryData.imagePost.src,
    };
  }

  if (entryData.comment) {
    return {
      parent: entryData.comment.parent,
      content: entryData.comment.body,
    };
  }

  throw new Error("Invalid entry data");
}
