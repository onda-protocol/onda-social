import { web3, BN } from "@project-serum/anchor";
import { Comment, Post, PostType } from "@prisma/client";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  ConcurrentMerkleTreeAccount,
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import base58 from "bs58";
import pkg from "js-sha3";

import {
  findForumConfigPda,
  findMetadataPda,
  findNamespacePda,
  findTreeMarkerPda,
  findTreeAuthorityPda,
  findCollectionAuthorityRecordPda,
  findEditionPda,
  findBubblegumSignerPda,
} from "utils/pda";
import { SerializedAward, fetchProof } from "lib/api";
import { parseDataV1Fields } from "utils/parse";
import { DataV1, LeafSchemaV1, Gate } from "./types";
import { BUBBLEGUM_PROGRAM_ID, METADATA_PROGRAM_ID } from "./constants";
import {
  getCompressionProgram,
  getNamespaceProgram,
  getAwardsProgram,
} from "./provider";

export async function initForumAndNamespace(
  connection: web3.Connection,
  wallet: AnchorWallet,
  maxDepth: number,
  maxBufferSize: number,
  name: string,
  uri: string,
  gates: Gate[] = []
) {
  const compressionProgram = getCompressionProgram(connection, wallet);
  const namespaceProgram = getNamespaceProgram(connection, wallet);
  const payer = wallet.publicKey;

  if (!compressionProgram.provider.sendAndConfirm) {
    throw new Error("Provider not found");
  }

  const merkleTreeKeypair = web3.Keypair.generate();
  const merkleTree = merkleTreeKeypair.publicKey;
  const forumConfig = findForumConfigPda(merkleTree);
  const namespacePda = findNamespacePda(name);
  const treeMarkerPda = findTreeMarkerPda(merkleTree);
  const space = getConcurrentMerkleTreeAccountSize(
    maxDepth,
    maxBufferSize,
    maxDepth - 5
  );
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  console.log("Allocating ", space, " bytes for merkle tree");
  console.log(
    lamports / web3.LAMPORTS_PER_SOL,
    " SOL required for rent exemption"
  );
  const allocTreeIx = web3.SystemProgram.createAccount({
    lamports,
    space,
    fromPubkey: payer,
    newAccountPubkey: merkleTree,
    programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  });

  const initIx = await compressionProgram.methods
    .initForum(maxDepth, maxBufferSize, gates)
    .accounts({
      payer,
      forumConfig,
      merkleTree,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .instruction();

  const namespaceIx = await namespaceProgram.methods
    .createNamespace(name, uri)
    .accounts({
      merkleTree,
      forumConfig,
      admin: wallet.publicKey,
      payer: wallet.publicKey,
      namespace: namespacePda,
      treeMarker: treeMarkerPda,
    })
    .instruction();

  const tx = new web3.Transaction().add(allocTreeIx, initIx, namespaceIx);

  tx.feePayer = payer;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  try {
    await compressionProgram.provider.sendAndConfirm(tx, [merkleTreeKeypair], {
      commitment: "confirmed",
      skipPreflight: true,
    });
  } catch (err) {
    // @ts-ignore
    console.log(err.logs);
    throw err;
  }

  console.log("Forum initialized");
  console.log("merkleTree: ", merkleTree.toBase58());
  console.log("forumConfig: ", forumConfig.toBase58());

  return merkleTree.toBase58();
}

export async function getEventFromSignature(
  connection: web3.Connection,
  signature: string
) {
  const program = getCompressionProgram(connection);
  const ixAccounts = program.idl.instructions.find(
    (i) => i.name === "addEntry"
  )?.accounts;
  const response = await waitForConfirmation(connection, signature);
  const message = response?.transaction.message;
  const innerInstructions = response?.meta?.innerInstructions?.[0];

  if (!message) {
    throw new Error("Transaction message not found");
  }

  if (!innerInstructions) {
    throw new Error("Noop instruction not found");
  }

  const instruction = message.instructions[0];
  const accountKeys = message.accountKeys;
  const accounts = instruction.accounts.map((key) => accountKeys[key]);
  accounts.forEach((key) => console.log(key.toBase58()));

  const merkleTreeAddressIndex = ixAccounts!.findIndex(
    (a) => a.name === "merkleTree"
  );

  if (merkleTreeAddressIndex === undefined) {
    throw new Error("Merkle tree address index not found");
  }

  const merkleTreeAddress = accounts[merkleTreeAddressIndex];
  const forumConfig = findForumConfigPda(merkleTreeAddress);

  const ixData = instruction.data;
  const entry = typeof ixData === "string" ? base58.decode(ixData) : ixData;
  const buffer = Buffer.from(entry.slice(8));
  const data: DataV1 = program.coder.types.decode("DataV1", buffer);

  const noopIx = innerInstructions.instructions[0];
  const serializedEvent = noopIx.data;
  const event = base58.decode(serializedEvent);
  const eventBuffer = Buffer.from(event.slice(8));
  const eventData: LeafSchemaV1 = program.coder.types.decode(
    "LeafSchema",
    eventBuffer
  ).v1;

  if (!eventData) {
    throw new Error("Event data did not decode");
  }

  return {
    id: eventData.id.toBase58(),
    nonce: eventData.nonce.toNumber(),
    author: eventData.author.toBase58(),
    createdAt: eventData.createdAt.toNumber(),
    editedAt: eventData.editedAt?.toNumber() || null,
    forum: merkleTreeAddress.toBase58(),
    forumConfig: forumConfig.toBase58(),
    data: parseDataV1Fields(data),
  };
}

const MAX_RETRIES = 5;

function waitForConfirmation(
  connection: web3.Connection,
  signature: string,
  retries: number = 0
): Promise<web3.TransactionResponse> {
  return new Promise(async (resolve, reject) => {
    const logs = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 2,
    });

    if (logs) {
      return resolve(logs as web3.TransactionResponse);
    }

    if (retries >= MAX_RETRIES) {
      return reject(undefined);
    }

    setTimeout(() => {
      waitForConfirmation(connection, signature, retries + 1).then(resolve);
    }, 500);
  });
}

export function getDataHash(
  connection: web3.Connection,
  entry: Post | Comment
) {
  const program = getCompressionProgram(connection);

  if ("postType" in entry) {
    switch (entry.postType) {
      case PostType.TEXT: {
        return pkg.keccak_256.digest(
          program.coder.types.encode<DataV1>("DataV1", {
            textPost: {
              title: entry.title,
              uri: entry.uri,
              nsfw: entry.nsfw,
            },
          })
        );
      }

      case PostType.IMAGE: {
        return pkg.keccak_256.digest(
          program.coder.types.encode<DataV1>("DataV1", {
            imagePost: {
              title: entry.title,
              uri: entry.uri,
              nsfw: entry.nsfw,
            },
          })
        );
      }

      case PostType.LINK: {
        return pkg.keccak_256.digest(
          program.coder.types.encode<DataV1>("DataV1", {
            linkPost: {
              title: entry.title,
              uri: entry.uri,
              nsfw: entry.nsfw,
            },
          })
        );
      }

      default: {
        throw new Error("Invalid post type");
      }
    }
  }

  return pkg.keccak_256.digest(
    program.coder.types.encode<DataV1>("DataV1", {
      comment: {
        post: new web3.PublicKey(entry.post),
        parent: entry.parent ? new web3.PublicKey(entry.parent) : null,
        uri: entry.uri,
      },
    })
  );
}

export async function deleteEntry(
  connection: web3.Connection,
  wallet: AnchorWallet,
  options: {
    forumId: string;
    entryId: string;
    createdAt: number;
    editedAt: number | null;
    nonce: number;
    dataHash: number[];
  }
) {
  const program = getCompressionProgram(connection, wallet);
  const merkleTreeAddress = new web3.PublicKey(options.forumId);
  const merkleTreeAccount =
    await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      merkleTreeAddress
    );
  const response = await fetchProof(options.entryId);
  const forumConfigAddress = findForumConfigPda(merkleTreeAddress);
  /**
   * root: [u8; 32],
   * created_at: i64,
   * edited_at: Option<i64>,
   * data_hash: [u8; 32],
   * nonce: u64,
   * index: u32,
   **/
  await program.methods
    .deleteEntry(
      Array.from(merkleTreeAccount.getCurrentRoot()),
      new BN(options.createdAt),
      options.editedAt ? new BN(options.editedAt) : null,
      options.dataHash,
      new BN(options.nonce),
      options.nonce
    )
    .accounts({
      forumConfig: forumConfigAddress,
      merkleTree: merkleTreeAddress,
      author: wallet.publicKey,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .remainingAccounts(
      response.proof.map((proof) => ({
        pubkey: new web3.PublicKey(proof),
        isWritable: false,
        isSigner: false,
      }))
    )
    .preInstructions([
      web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 1_000_000,
      }),
    ])
    .rpc({
      commitment: "confirmed",
    });
}

export async function createNamepace(
  connection: web3.Connection,
  wallet: AnchorWallet,
  merkleTree: web3.PublicKey,
  name: string,
  uri: string
) {
  const program = getNamespaceProgram(connection, wallet);
  const namespacePda = findNamespacePda(name);
  const treeMarkerPda = findTreeMarkerPda(merkleTree);
  const forumConfigPda = findForumConfigPda(merkleTree);

  await program.methods
    .createNamespace(name, uri)
    .accounts({
      merkleTree,
      admin: wallet.publicKey,
      payer: wallet.publicKey,
      namespace: namespacePda,
      treeMarker: treeMarkerPda,
      forumConfig: forumConfigPda,
    })
    .rpc();
}

export async function giveAward(
  connection: web3.Connection,
  wallet: AnchorWallet,
  options: {
    entryId: string;
    award: SerializedAward;
  }
) {
  const program = getAwardsProgram(connection, wallet);
  const leafOwner = new web3.PublicKey(options.entryId);
  const award = new web3.PublicKey(options.award.id);
  const merkleTree = new web3.PublicKey(options.award.merkleTree);
  const collectionMint = new web3.PublicKey(options.award.collectionMint);
  const collectionMetadataPda = findMetadataPda(collectionMint);
  const editionPda = findEditionPda(collectionMint);
  const treeAuthorityPda = findTreeAuthorityPda(merkleTree);
  const collectionAuthorityRecordPda = findCollectionAuthorityRecordPda(
    collectionMint,
    award
  );
  const bubblegumSignerPda = findBubblegumSignerPda();

  await program.methods
    .giveAward()
    .accounts({
      award,
      leafOwner,
      merkleTree,
      payer: wallet.publicKey,
      sessionToken: null,
      signer: wallet.publicKey,
      treeAuthority: treeAuthorityPda,
      collectionAuthorityRecordPda,
      collectionMint,
      collectionMetadata: collectionMetadataPda,
      editionAccount: editionPda,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumSigner: bubblegumSignerPda,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      tokenMetadataProgram: METADATA_PROGRAM_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
    })
    .rpc({
      preflightCommitment: "confirmed",
    });
}
