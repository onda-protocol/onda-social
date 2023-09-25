import { web3 } from "@project-serum/anchor";
import { Prisma } from "@prisma/client";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";
import base58 from "bs58";
import { Instruction } from "helius-sdk";

import { AWARDS_PROGRAM_ID } from "../anchor/constants";
import { IDL as AwardsIDS } from "../anchor/idl/onda_awards";
import { getAwardsProgram } from "../anchor/provider";
import { CreateAwardArgs } from "../anchor/types";
import prisma from "../prisma";
import { genIxIdentifier } from "./helpers";

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);
const rewardsProgram = getAwardsProgram(connection);

const rewardsIxIds = AwardsIDS.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

export async function awardsParser(ix: Instruction) {
  const ixData = base58.decode(ix.data);
  const ixId = base58.encode(ixData.slice(0, 8));
  const ixName = rewardsIxIds.find((i) => i.id === ixId)?.name;
  const ixAccounts = AwardsIDS.instructions.find(
    (i) => i.name === ixName
  )?.accounts;
  console.log("Handling ix: ", ixName);

  if (ixName === undefined || ixAccounts === undefined) {
    return;
  }

  switch (ixName) {
    case "createAward": {
      const authorityIndex = ixAccounts.findIndex((a) => a.name === "payer");
      const awardIndex = ixAccounts.findIndex((a) => a.name === "award");
      const matchingAwardIndex = ixAccounts.findIndex(
        (a) => a.name === "matchingAward"
      );
      const collectionMintIndex = ixAccounts.findIndex(
        (a) => a.name === "collectionMint"
      );
      const collectionMetadataIndex = ixAccounts.findIndex(
        (a) => a.name === "collectionMetadata"
      );
      const merkleTreeIndex = ixAccounts.findIndex(
        (a) => a.name === "merkleTree"
      );
      console.log(ixAccounts);
      const authority = ix.accounts[authorityIndex];
      const award = ix.accounts[awardIndex];
      const matchingAward = ix.accounts[matchingAwardIndex];
      const collectionMint = ix.accounts[collectionMintIndex];
      const collectionMetadata = ix.accounts[collectionMetadataIndex];
      const merkleTree = ix.accounts[merkleTreeIndex];

      const metadataArgs = rewardsProgram.coder.types.decode<CreateAwardArgs>(
        "CreateAwardArgs",
        Buffer.from(ixData.slice(16))
      );
      const amount = metadataArgs.amount;
      const feeBasisPoints = metadataArgs.feeBasisPoints;
      const metadata = await Metadata.fromAccountAddress(
        connection,
        new web3.PublicKey(collectionMetadata)
      );
      const metadataJson = await axios.get(metadata.data.uri);
      const name = metadataJson.data.name!;
      const description = metadataJson.data.description!;
      const image = metadataJson.data.image!;
      const hasMatchingAward = matchingAward !== AWARDS_PROGRAM_ID.toBase58();

      console.log({
        name,
        description,
        image,
        amount: amount.toNumber(),
        feeBasisPoints: feeBasisPoints,
        award,
        matchingAward: hasMatchingAward ? matchingAward : null,
        authority,
        collectionMint,
        merkleTree,
      });

      await prisma.award.create({
        data: {
          id: award,
          amount: BigInt(amount.toNumber()),
          authority,
          collectionMint,
          description,
          merkleTree,
          image,
          name,
          Matching: hasMatchingAward
            ? {
                connect: {
                  id: matchingAward,
                },
              }
            : undefined,
        },
      });

      break;
    }

    case "giveAward": {
      const awardIndex = ixAccounts.findIndex((a) => a.name === "award");
      const claimIndex = ixAccounts.findIndex((a) => a.name === "claim");
      const leafOwnerIndex = ixAccounts.findIndex((a) => a.name === "entryId");
      const awardId = ix.accounts[awardIndex];
      const claimId = ix.accounts[claimIndex]; // TODO check if this is the correct account
      const entryId = ix.accounts[leafOwnerIndex];

      const award = await prisma.award.findUnique({
        where: {
          id: awardId,
        },
      });

      await prisma.$transaction(async (transaction) => {
        const [awardResult, postResult, commentResult] =
          await Promise.allSettled([
            transaction.award.findUnique({
              where: {
                id: awardId,
              },
            }),
            transaction.post.findUnique({
              where: {
                id: entryId,
              },
            }),
            transaction.comment.findUnique({
              where: {
                id: entryId,
              },
            }),
          ]);

        if (awardResult.status === "rejected" || awardResult.value === null) {
          return;
        }

        if (postResult.status === "fulfilled" && postResult.value !== null) {
          const post = postResult.value;
          const awards = (post.awards ?? {}) as Prisma.JsonObject;
          const currentReward = awards[awardId] as
            | Prisma.JsonObject
            | undefined;
          const currentAwardParsed = currentReward ?? {
            image: award?.image,
            count: 0,
          };
          currentAwardParsed.count = Number(currentAwardParsed.count) + 1;
          awards[awardId] = currentAwardParsed;

          await transaction.post.update({
            where: {
              id: entryId,
            },
            data: {
              awards,
            },
          });
        } else if (
          commentResult.status === "fulfilled" &&
          commentResult.value !== null
        ) {
          const comment = commentResult.value;
          const awards = (comment.awards ?? {}) as Prisma.JsonObject;
          const currentAward = awards[awardId] as Prisma.JsonObject | undefined;
          const currentAwardParsed = currentAward ?? {
            image: award?.image,
            count: 0,
          };
          currentAwardParsed.count = Number(currentAwardParsed.count) + 1;
          awards[awardId] = currentAwardParsed;

          await transaction.comment.update({
            where: {
              id: entryId,
            },
            data: {
              awards,
            },
          });
        }
      });

      break;
    }

    default: {
      break;
    }
  }
}
