import {
  web3,
  BN,
  Wallet,
  Program,
  AnchorProvider,
} from "@project-serum/anchor";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";
import base58 from "bs58";
import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";

import { trimNullChars } from "../../utils/format";
import {
  COMPRESSION_PROGRAM_ID,
  BLOOM_PROGRAM_ID,
  PROFILE_PROGRAM_ID,
} from "../anchor/constants";
import { IDL as BloomIDL } from "../anchor/idl/onda_bloom";
import {
  OndaCompression,
  IDL as CompressionIDL,
} from "../anchor/idl/onda_compression";
import { IDL as ProfileIDL } from "../anchor/idl/onda_profile";
import { DataV1, LeafSchemaV1, RestrictionType } from "../anchor/types";
import prisma from "../prisma";
import { PostType } from "@prisma/client";
import { findEntryId } from "utils/pda";

const bloomIxIds = BloomIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

const compressionIxIds = CompressionIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

const profileIxIds = ProfileIDL.instructions.map((ix) => {
  return {
    name: ix.name,
    id: genIxIdentifier(ix.name),
  };
});

function genIxIdentifier(ixName: string) {
  const namespace = "global";
  const name = snakeCase(ixName);
  const preimage = `${namespace}:${name}`;
  return base58.encode(sha256.digest(preimage).slice(0, 8));
}

const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
);

class MockWallet implements Wallet {
  constructor(readonly payer: web3.Keypair) {}

  async signTransaction(tx: web3.Transaction): Promise<web3.Transaction> {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions(
    txs: web3.Transaction[]
  ): Promise<web3.Transaction[]> {
    return txs.map((t) => {
      t.partialSign(this.payer);
      return t;
    });
  }

  get publicKey(): web3.PublicKey {
    return this.payer.publicKey;
  }
}

const compressionProgram = new Program<OndaCompression>(
  CompressionIDL,
  COMPRESSION_PROGRAM_ID,
  new AnchorProvider(connection, new MockWallet(web3.Keypair.generate()), {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  })
);

export default async function enhancedTransactionParser(body: any) {
  for (const tx of body) {
    for (const ix of tx.instructions) {
      switch (ix.programId) {
        case BLOOM_PROGRAM_ID.toBase58(): {
          const ixData = base58.decode(ix.data);
          const ixId = base58.encode(ixData.slice(0, 8));
          const ixName = bloomIxIds.find((i) => i.id === ixId)?.name;
          const ixAccounts = BloomIDL.instructions.find(
            (i) => i.name === ixName
          )?.accounts;
          console.log("Handling ix: ", ixName);

          if (ixName === undefined || ixAccounts === undefined) {
            break;
          }

          switch (ixName) {
            case "feedPlankton": {
              const buffer = Buffer.from(ixData.slice(8, 40));
              const entryId = new web3.PublicKey(buffer);
              // expect one of these to fail
              try {
                await prisma.post.update({
                  where: {
                    id: entryId.toBase58(),
                  },
                  data: {
                    likes: {
                      increment: 1,
                    },
                  },
                });
              } catch (err) {
                try {
                  await prisma.comment.update({
                    where: {
                      id: entryId.toBase58(),
                    },
                    data: {
                      likes: {
                        increment: 1,
                      },
                    },
                  });
                } catch {
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

        case COMPRESSION_PROGRAM_ID.toBase58(): {
          const ixData = base58.decode(ix.data);
          const ixId = base58.encode(ixData.slice(0, 8));
          const ixName = compressionIxIds.find((i) => i.id === ixId)?.name;
          console.log("Handling ix: ", ixName);

          const ixAccounts = CompressionIDL.instructions.find(
            (i) => i.name === ixName
          )?.accounts;

          if (ixName === undefined || ixAccounts === undefined) {
            // console.log("Unknown instruction: ", ix);
            break;
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
              const restriction =
                compressionProgram.coder.types.decode<RestrictionType>(
                  "RestrictionType",
                  buffer.subarray(8)
                );

              const data = {
                id: merkleTreeAddress.toBase58(),
                config: forumConfigAddress.toBase58(),
                collection: restriction?.collection?.address?.toBase58(),
                totalCapacity: totalCapacity.toNumber(),
              };
              console.log(data);

              await prisma.forum.create({
                data,
              });

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
              const dataV1 = getDataV1Fields(dataDecoded);
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
                // case "LinkPost":
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
                case "TextPost": {
                  const body = await axios
                    .get(dataV1.uri)
                    .then((res) => res.data);

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

                case "Comment": {
                  if (dataV1.uri === undefined) {
                    throw new Error("Comment body is undefined");
                  }

                  const body = await axios
                    .get(dataV1.uri)
                    .then((res) => res.data);
                  console.log("body: ", body);
                  console.log("post: ", dataV1.post!.toBase58());
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
              const forumAddress = ix.accounts[merkleTreeIndex];
              const entryIndex = new BN(
                Buffer.from(ixData.slice(-4))
              ).toNumber();
              const entryId = findEntryId(forumAddress, entryIndex);
              console.log("entryIndex: ", entryIndex);
              console.log("entryId: ", entryId);

              try {
                await prisma.post.update({
                  where: {
                    id: entryId.toBase58(),
                  },
                  data: {
                    body: "[deleted]",
                    uri: "[deleted]",
                    hash: null,
                    editedAt: Date.now() / 1000,
                  },
                });
              } catch (err) {
                try {
                  await prisma.comment.update({
                    where: {
                      id: entryId.toBase58(),
                    },
                    data: {
                      body: "[deleted]",
                      uri: "[deleted]",
                      hash: null,
                      editedAt: Date.now() / 1000,
                    },
                  });
                } catch {
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

        case PROFILE_PROGRAM_ID.toBase58(): {
          const ixData = base58.decode(ix.data);
          const ixId = base58.encode(ixData.slice(0, 8));
          const ixName = profileIxIds.find((i) => i.id === ixId)?.name;
          console.log("Handling ix: ", ixName);
          const ixAccounts = ProfileIDL.instructions.find(
            (i) => i.name === ixName
          )?.accounts;

          if (ixName === undefined || ixAccounts === undefined) {
            console.log("Unknown instruction: ", ix);
            break;
          }

          switch (ixName) {
            case "updateProfile": {
              const buffer = Buffer.from(ixData.slice(8 + 4));
              const name = new TextDecoder().decode(buffer);
              console.log("name: ", name);
              const mintIndex = ixAccounts.findIndex(
                (account) => account.name === "mint"
              );
              const mintAddress = new web3.PublicKey(ix.accounts[mintIndex]);
              const metadataIndex = ixAccounts.findIndex(
                (account) => account.name === "metadata"
              );
              const metadataAddress = new web3.PublicKey(
                ix.accounts[metadataIndex]
              );
              const userIndex = ixAccounts.findIndex(
                (account) => account.name === "author"
              );
              const userAddress = new web3.PublicKey(ix.accounts[userIndex]);

              const metadata = await Metadata.fromAccountAddress(
                connection,
                metadataAddress
              );
              const avatar: string = await axios
                .get(metadata.data.uri)
                .then((res) => res.data.image);

              console.log("avatar: ", avatar);

              console.log({
                where: {
                  id: userAddress.toBase58(),
                },
                update: {
                  avatar,
                  name,
                  mint: mintAddress.toBase58(),
                },
                create: {
                  avatar,
                  name,
                  id: userAddress.toBase58(),
                  mint: mintAddress.toBase58(),
                },
              });

              await prisma.user.upsert({
                where: {
                  id: userAddress.toBase58(),
                },
                update: {
                  avatar,
                  name,
                  mint: mintAddress.toBase58(),
                },
                create: {
                  avatar,
                  name,
                  id: userAddress.toBase58(),
                  mint: mintAddress.toBase58(),
                },
              });
            }

            default: {
              break;
            }
          }
        }

        default: {
          // Do nothing
          break;
        }
      }
    }
  }
}

interface CreatePostV1Args {
  forumId: string;
  schemaV1: LeafSchemaV1;
  dataV1: ReturnType<typeof getDataV1Fields>;
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

function getDataV1Fields(entryData: DataV1) {
  if (entryData.textPost) {
    return {
      type: "TextPost",
      title: entryData.textPost.title,
      uri: entryData.textPost.uri,
    };
  }

  // if (entryData.linkPost) {
  //   return {
  //     type: "LinkPost",
  //     title: entryData.linkPost.title,
  //     uri: entryData.linkPost.uri,
  //   };
  // }

  if (entryData.imagePost) {
    return {
      type: "ImagePost",
      title: entryData.imagePost.title,
      uri: entryData.imagePost.uri,
    };
  }

  if (entryData.comment) {
    return {
      type: "Comment",
      post: entryData.comment.post,
      parent: entryData.comment.parent,
      uri: entryData.comment.uri,
    };
  }

  throw new Error("Invalid entry data");
}
