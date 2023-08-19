import { BN, web3 } from "@project-serum/anchor";
import { Rule, PostType, Operator } from "@prisma/client/edge";
import axios from "axios";
import base58 from "bs58";
import { Instruction } from "helius-sdk";

import { findEntryId } from "../../utils/pda";
import { trimNullChars } from "../../utils/format";
import { parseDataV1Fields } from "../../utils/parse";
import { IDL as CompressionIDL } from "../anchor/idl/onda_compression";
import { DataV1, LeafSchemaV1, Gate } from "../anchor/types";
import { getCompressionProgram } from "../anchor/provider";
import prisma from "../prisma";
import { genIxIdentifier } from "./helpers";

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);

const compressionProgram = getCompressionProgram(connection);

const compressionIxIds = CompressionIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

export async function compressionParser(ix: Instruction) {
  const ixData = base58.decode(ix.data);
  const ixId = base58.encode(ixData.slice(0, 8));
  const ixName = compressionIxIds.find((i) => i.id === ixId)?.name;
  console.log("Handling ix: ", ixName);

  const ixAccounts = CompressionIDL.instructions.find(
    (i) => i.name === ixName
  )?.accounts;

  if (ixName === undefined || ixAccounts === undefined) {
    return;
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
      const forumConfig = await compressionProgram.account.forumConfig.fetch(
        forumConfigAddress
      );
      const gates = forumConfig.gate as Array<Gate>;

      await prisma.forum.create({
        data: {
          id: merkleTreeAddress.toBase58(),
          admin: forumConfig.admin.toBase58(),
          config: forumConfigAddress.toBase58(),
          totalCapacity: totalCapacity.toNumber(),
        },
      });

      if (gates.length) {
        await prisma.gate.createMany({
          data: gates.map((gate) => ({
            amount: gate.amount.toNumber(),
            forum: merkleTreeAddress.toBase58(),
            address: gate.address.map((a) => a.toBase58()),
            ruleType: getRuleType(gate),
            operator: getOperator(gate),
          })),
        });
      }

      break;
    }

    case "addEntry": {
      // Get forum address
      const merkleTreeIndex = ixAccounts.findIndex(
        (account) => account.name === "merkleTree"
      );
      const forumAddress = ix.accounts[merkleTreeIndex];
      // Decode entry data
      const buffer = Buffer.from(ixData.slice(8));
      const dataDecoded = compressionProgram.coder.types.decode<DataV1>(
        "DataV1",
        buffer
      );
      const dataV1 = parseDataV1Fields(dataDecoded);
      // Decode schema event data
      const noopIx = ix.innerInstructions[0];
      const serializedSchemaEvent = noopIx.data as string;
      const schemaEvent = base58.decode(serializedSchemaEvent);
      const leafHash = Buffer.from(schemaEvent.slice(-32));
      const encodedLeafHash = base58.encode(leafHash);
      const schemaEventBuffer = Buffer.from(
        schemaEvent.slice(8, schemaEvent.length - 32)
      );
      const schemaEventDecoded = compressionProgram.coder.types.decode(
        "LeafSchema",
        schemaEventBuffer
      );
      const schemaV1 = schemaEventDecoded["v1"] as LeafSchemaV1;

      if (schemaV1 === undefined) {
        throw new Error("Unknown schema version");
      }

      switch (dataV1.type) {
        case "TextPost": {
          const body = await axios.get(dataV1.uri).then((res) => res.data);

          await createPostV1({
            postType: PostType.TEXT,
            forumId: forumAddress,
            schemaV1,
            dataV1,
            body,
            hash: encodedLeafHash,
          });
          break;
        }

        case "ImagePost": {
          await createPostV1({
            postType: PostType.IMAGE,
            forumId: forumAddress,
            schemaV1,
            dataV1,
            hash: encodedLeafHash,
          });
          break;
        }

        case "LinkPost": {
          await createPostV1({
            postType: PostType.LINK,
            forumId: forumAddress,
            schemaV1,
            dataV1,
            hash: encodedLeafHash,
          });
          break;
        }

        case "Comment": {
          if (dataV1.uri === undefined) {
            throw new Error("Comment body is undefined");
          }

          const body = await axios.get(dataV1.uri).then((res) => res.data);
          await prisma.comment.create({
            data: {
              body,
              id: schemaV1.id.toBase58(),
              uri: trimNullChars(dataV1.uri),
              hash: encodedLeafHash,
              createdAt: schemaV1.createdAt.toNumber(),
              nonce: schemaV1.nonce.toNumber(),
              Parent: dataV1.parent
                ? {
                    connect: {
                      id: dataV1.parent.toBase58(),
                    },
                  }
                : undefined,
              Post: {
                connect: {
                  id: dataV1.post!.toBase58(),
                },
              },
              Author: {
                connectOrCreate: {
                  where: {
                    id: schemaV1.author.toBase58(),
                  },
                  create: {
                    id: schemaV1.author.toBase58(),
                  },
                },
              },
            },
          });
          break;
        }
      }

      break;
    }

    case "deleteEntry": {
      // Get forum address
      const merkleTreeIndex = ixAccounts.findIndex(
        (account) => account.name === "merkleTree"
      );
      const merkleTreeAddress = new web3.PublicKey(
        ix.accounts[merkleTreeIndex]
      );
      const entryIndex = new BN(ixData.slice(-4), "le").toNumber();
      const entryId = findEntryId(merkleTreeAddress, entryIndex);

      try {
        await prisma.post.update({
          where: {
            id: entryId.toBase58(),
          },
          data: {
            body: "[deleted]",
            uri: "[deleted]",
            hash: null,
            editedAt: Math.floor(Date.now() / 1000),
          },
        });
      } catch (err) {
        try {
          await prisma.comment.delete({
            where: {
              id: entryId.toBase58(),
            },
          });
        } catch (err) {
          console.log(err);
          // Fail silently - entry not found
          console.log("Entry not found");
        }
      }

      break;
    }

    default: {
      break;
    }
  }
}

interface CreatePostV1Args {
  forumId: string;
  schemaV1: LeafSchemaV1;
  dataV1: ReturnType<typeof parseDataV1Fields>;
  postType: PostType;
  body?: string;
  hash: string;
}

function createPostV1({
  forumId,
  schemaV1,
  dataV1,
  postType,
  body,
  hash,
}: CreatePostV1Args) {
  if (schemaV1 === undefined) {
    throw new Error("Schema is undefined");
  }

  return prisma.post.create({
    data: {
      postType,
      hash,
      body: body ?? null,
      id: schemaV1.id.toBase58(),
      title: dataV1.title!,
      uri: trimNullChars(dataV1.uri),
      createdAt: schemaV1.createdAt.toNumber(),
      nonce: schemaV1.nonce.toNumber(),
      Forum: {
        connect: {
          id: forumId,
        },
      },
      Author: {
        connectOrCreate: {
          where: {
            id: schemaV1.author.toBase58(),
          },
          create: {
            id: schemaV1.author.toBase58(),
          },
        },
      },
    },
  });
}

function getRuleType(gate: Gate) {
  // @ts-ignore
  if (gate.ruleType.nft) {
    return Rule.NFT;
  }

  if (gate.ruleType.token) {
    return Rule.Token;
  }

  if (gate.ruleType.additionalSigner) {
    return Rule.AdditionalSigner;
  }

  if (gate.ruleType.pass) {
    return Rule.Pass;
  }

  throw new Error("Unknown rule type");
}

function getOperator(gate: Gate) {
  // @ts-ignore
  if (gate.operator.and) {
    return Operator.AND;
  }
  // @ts-ignore
  if (gate.operator.or) {
    return Operator.OR;
  }
  // @ts-ignore
  if (gate.operator.not) {
    return Operator.NOT;
  }

  throw new Error("Unknown operator");
}
