import type { NextApiRequest, NextApiResponse } from "next";
import {
  web3,
  Wallet,
  AnchorProvider,
  Program,
  Coder,
} from "@project-serum/anchor";
import { EntryType } from "@prisma/client";
import base58 from "bs58";
import camelcase from "camelcase";
import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";

import { PROGRAM_ID } from "../../lib/anchor";
import { IDL, OndaSocial } from "../../lib/anchor/idl";
import { LeafSchema, EntryData } from "../../lib/anchor/types";
import prisma from "../../lib/prisma";

const transactions = [
  {
    accountData: [
      {
        account: "AH7F2EPHXWhfF5yc7xnv1zPbwz3YqD6CtAqbCyE9dy7r",
        nativeBalanceChange: -5000,
        tokenBalanceChanges: [],
      },
      {
        account: "3rmSmHQKevpDjY8WbmRq15QZ4HnpsfmmpR1FvHNH9g2T",
        nativeBalanceChange: 0,
        tokenBalanceChanges: [],
      },
      {
        account: "RRDm68bqGqV9ZdRuoEaoWPiY71wm3wJc3VEHyozX78c",
        nativeBalanceChange: 0,
        tokenBalanceChanges: [],
      },
      {
        account: "11111111111111111111111111111111",
        nativeBalanceChange: 0,
        tokenBalanceChanges: [],
      },
      {
        account: "BWWPkJpv6fV2ZM5aNua8btxBXooWdW2qjWwUDBhz1p9S",
        nativeBalanceChange: 0,
        tokenBalanceChanges: [],
      },
      {
        account: "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK",
        nativeBalanceChange: 0,
        tokenBalanceChanges: [],
      },
      {
        account: "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
        nativeBalanceChange: 0,
        tokenBalanceChanges: [],
      },
    ],
    description: "",
    events: {},
    fee: 5000,
    feePayer: "AH7F2EPHXWhfF5yc7xnv1zPbwz3YqD6CtAqbCyE9dy7r",
    instructions: [
      {
        accounts: [
          "AH7F2EPHXWhfF5yc7xnv1zPbwz3YqD6CtAqbCyE9dy7r",
          "3rmSmHQKevpDjY8WbmRq15QZ4HnpsfmmpR1FvHNH9g2T",
          "BWWPkJpv6fV2ZM5aNua8btxBXooWdW2qjWwUDBhz1p9S",
          "BWWPkJpv6fV2ZM5aNua8btxBXooWdW2qjWwUDBhz1p9S",
          "BWWPkJpv6fV2ZM5aNua8btxBXooWdW2qjWwUDBhz1p9S",
          "RRDm68bqGqV9ZdRuoEaoWPiY71wm3wJc3VEHyozX78c",
          "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
          "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK",
          "11111111111111111111111111111111",
        ],
        data: "HyrUx88qVayMMhAN5GQj5GzCrmVadE5WF8xVSbbuSabycPQm",
        innerInstructions: [
          {
            accounts: [],
            data: "4YpdnnuGkdzRKudrEXAh78w6nr6Rexh5AYePmDW7D41EqVtM2FCW4ETFrUQCAryj5p3QRMBRFrkqao4CbKoXuWj2LGaetvbvwiMTguLEXwaFKQL2E84yEhtHvfawX3heK3tC1Ka2zsfkEDbRGVU7yhd4EbDFpcJ4rXjQ8tHc45sk33zycoV4kUorbJPKb7nPsJ1rTHMZMzV7DrCbfQH",
            programId: "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
          },
          {
            accounts: [
              "RRDm68bqGqV9ZdRuoEaoWPiY71wm3wJc3VEHyozX78c",
              "3rmSmHQKevpDjY8WbmRq15QZ4HnpsfmmpR1FvHNH9g2T",
              "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
            ],
            data: "8RkZ9BWdS73S6z4o1ND9HhwnU8BxQiDjFrUvtaQA3tXaKLcTPWVuY77",
            programId: "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK",
          },
          {
            accounts: [],
            data: "112Tajnc2VNRoFFGi9hJjdecVonAdhH1L8132Y2zc9VYmRpjnSvKYFKxy5xw5jCMsCDkuYQvowWssqLi1i6PurtqHbF1zd935KKnzKKuv6pVFmR8QX1jxh39JbC7pUp6ZqwJXruwtTYSfXYtzzGpZUJSfX13866PhHWQrKeFGY9KPhDLQHcPnFU4UwoXiWyignQUUe7avuQXUTBZt7xenPAuPqvq8y8FmhkuHc4xE4noC75BB2u9WmhmpFJrqCfdL6x1Atzi9rwWoyDPkMb1iwEoopdXnfGoYLEXDyVpfzrqd6zgwfUegBJbWoHFVaTGjoRJmBpAvFhoUJ27gyjmFoBigrFFYUu3UJFBRRgy13wDuu4v3SamP4MZiqLDh62J82L8L6DsCrqqELErswNGEvs8Pvoiqm8PCpiKKWDRkHg3Ehh3kBJK2oYyMpMgKLVKm4pe71bmz6W2otDYcA18utzvAgxXStGFHpqyFFUA1vrK3c1MVBdVXKiKV8RgBsNwpHQDj2ASFZVmPoKim3p7KsJ5rM3A7fx3NKLA2B8DNiLR7RPSFojruENiPEzP8hPLFNWn6mLKnVMV6CsShVuGncdq8ZMY3QjQ3c7xo42dhtVquqxqByGUgrnkYYMkSrYB2estLh1Lqe6bUkfZsMDMDtqKVzMHMhDP6dRhbmVEg3NXSFC3kKjbSmGdufyox1MSBbsZfmowfai5PSGKnukgQ95DkkN33gzprLyadT2ZCjBYRWGRC3oJEr8qL2tQkfb3cduKVuTHGnChx3fVx79UUoZ12JXy6kcZo2Xsm",
            programId: "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
          },
        ],
        programId: "BWWPkJpv6fV2ZM5aNua8btxBXooWdW2qjWwUDBhz1p9S",
      },
    ],
    nativeTransfers: [],
    signature:
      "5s2UGad16ZzeVfEUuHSNtC3XHzWiu3BL4FWsThYModSZXuQd1UXqvEGnbGbKFZ5XAhW5hybgkRBYcXExKLpwXVue",
    slot: 207902624,
    source: "UNKNOWN",
    timestamp: 1681050578,
    tokenTransfers: [],
    transactionError: null,
    type: "UNKNOWN",
  },
];

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
  for (const tx of transactions) {
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
          console.log("schemaV1: ", schemaV1);
          console.log(entryType);
          if (entryType === undefined) {
            // @ts-expect-error
            throw new Error(`Unknown entry type: ${schemaV1.entryType}`);
          }

          const { title, parent, content } = getEntryFields(entryDecoded);
          console.log(schemaV1.id.toBase58());
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
