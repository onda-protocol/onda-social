import { web3 } from "@project-serum/anchor";
import { Prisma } from "@prisma/client/edge";
import axios from "axios";
import base58 from "bs58";
import { Instruction } from "helius-sdk";

import { IDL as RewardsIDL } from "../anchor/idl/onda_rewards";
import { getRewardsProgram } from "../anchor/provider";
import { RewardMetadata } from "../anchor/types";
import prisma from "../prisma";
import { genIxIdentifier } from "./helpers";

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);
const rewardsProgram = getRewardsProgram(connection);

const rewardsIxIds = RewardsIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

export async function rewardsParser(ix: Instruction) {
  const ixData = base58.decode(ix.data);
  const ixId = base58.encode(ixData.slice(0, 8));
  const ixName = rewardsIxIds.find((i) => i.id === ixId)?.name;
  const ixAccounts = RewardsIDL.instructions.find(
    (i) => i.name === ixName
  )?.accounts;
  console.log("Handling ix: ", ixName);

  if (ixName === undefined || ixAccounts === undefined) {
    return;
  }

  switch (ixName) {
    case "createReward": {
      const authorityIndex = ixAccounts.findIndex((a) => a.name === "payer");
      const rewardIndex = ixAccounts.findIndex((a) => a.name === "reward");
      const collectionMintIndex = ixAccounts.findIndex(
        (a) => a.name === "collectionMint"
      );
      const merkleTreeIndex = ixAccounts.findIndex(
        (a) => a.name === "merkleTree"
      );
      const authority = ix.accounts[authorityIndex];
      const reward = ix.accounts[rewardIndex];
      const collectionMint = ix.accounts[collectionMintIndex];
      const merkleTree = ix.accounts[merkleTreeIndex];

      const metadataArgs = rewardsProgram.coder.types.decode<RewardMetadata>(
        "RewardMetadata",
        Buffer.from(ixData.slice(16))
      );
      const metadataJson = await axios.get(metadataArgs.uri);
      const description = metadataJson.data.description as string;
      const image = metadataJson.data.image as string;

      await prisma.reward.create({
        data: {
          authority,
          collectionMint,
          description,
          merkleTree,
          image,
          id: reward,
          amount: BigInt(0),
          name: metadataArgs.name,
        },
      });

      break;
    }

    case "giveReward": {
      const rewardIndex = ixAccounts.findIndex((a) => a.name === "reward");
      const leafOwnerIndex = ixAccounts.findIndex(
        (a) => a.name === "leafOwner"
      );
      const rewardId = ix.accounts[rewardIndex];
      const entryId = ix.accounts[leafOwnerIndex];

      const reward = await prisma.reward.findUnique({
        where: {
          id: rewardId,
        },
      });

      await prisma.$transaction(async (transaction) => {
        const [rewardResult, postResult, commentResult] =
          await Promise.allSettled([
            transaction.reward.findUnique({
              where: {
                id: rewardId,
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

        if (rewardResult.status === "rejected" || rewardResult.value === null) {
          return;
        }

        if (postResult.status === "fulfilled" && postResult.value !== null) {
          const post = postResult.value;
          const rewards = (post.rewards ?? {}) as Prisma.JsonObject;
          const currentReward = rewards[rewardId] as
            | Prisma.JsonObject
            | undefined;
          const currentRewardParsed = currentReward ?? {
            image: reward?.image,
            count: 0,
          };
          currentRewardParsed.count = Number(currentRewardParsed.count) + 1;
          rewards[rewardId] = currentRewardParsed;

          await transaction.post.update({
            where: {
              id: entryId,
            },
            data: {
              points: {
                increment: 1,
              },
              rewards,
            },
          });
        } else if (
          commentResult.status === "fulfilled" &&
          commentResult.value !== null
        ) {
          const comment = commentResult.value;
          const rewards = (comment.rewards ?? {}) as Prisma.JsonObject;
          const currentReward = rewards[rewardId] as
            | Prisma.JsonObject
            | undefined;
          const currentRewardParsed = currentReward ?? {
            image: reward?.image,
            count: 0,
          };
          currentRewardParsed.count = Number(currentRewardParsed.count) + 1;
          rewards[rewardId] = currentRewardParsed;

          await transaction.comment.update({
            where: {
              id: entryId,
            },
            data: {
              points: {
                increment: 1,
              },
              rewards,
            },
          });
        }
      });

      if (reward) {
        // expect one of these to fail
        try {
          await prisma.post.update({
            where: {
              id: entryId,
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        } catch (err) {
          try {
            await prisma.comment.update({
              where: {
                id: entryId,
              },
              data: {
                points: {
                  increment: 1,
                },
              },
            });
          } catch {
            // Fail silently - entry not found
            console.log("Entry not found");
          }
        }
      }

      break;
    }

    default: {
      break;
    }
  }
}
