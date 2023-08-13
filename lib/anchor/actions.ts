import { web3, BN } from "@project-serum/anchor";
import { PostType } from "@prisma/client";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  ConcurrentMerkleTreeAccount,
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { SessionWalletInterface } from "@gumhq/react-sdk";
import base58 from "bs58";
import pkg from "js-sha3";

import {
  findForumConfigPda,
  findBloomPda,
  findMetadataPda,
  findProfilePda,
  findNamespacePda,
  findTreeMarkerPda,
  findEscrowTokenPda,
  findRewardEscrowPda,
  findClaimMarkerPda,
} from "utils/pda";
import { parseDataV1Fields } from "utils/parse";
import { DataV1, LeafSchemaV1, Gate } from "./types";
import {
  getCompressionProgram,
  getBloomProgram,
  getProfileProgram,
  getNamespaceProgram,
} from "./provider";
import { PLANKTON_MINT, PROTOCOL_FEE_PLANKTON_ATA } from "./constants";
import {
  PostWithCommentsCountAndForum,
  SerializedCommentNested,
  SerializedForum,
  fetchForumPass,
  fetchProof,
} from "lib/api";

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
    maxDepth - 3
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

export async function addEntry(
  connection: web3.Connection,
  wallet: AnchorWallet,
  session: SessionWalletInterface,
  options: {
    forum: SerializedForum;
    data: DataV1;
  }
): Promise<string> {
  assertSessionIsValid(session);
  // @ts-ignore
  const program = getCompressionProgram(connection, wallet);
  const merkleTree = new web3.PublicKey(options.forum.id);
  const forumConfig = findForumConfigPda(merkleTree);

  let mint = null;
  let tokenAccount = null;
  let metadata = null;

  if (options.forum.gates?.length) {
    const result = await fetchForumPass(
      options.forum.id,
      wallet.publicKey.toBase58()
    );

    if (result.error) {
      throw new Error(result.error);
    }

    mint = new web3.PublicKey(result.mint);
    tokenAccount = new web3.PublicKey(result.tokenAccount);
    metadata = result.metadata ? new web3.PublicKey(result.metadata) : null;
  }

  const transaction = await program.methods
    .addEntry(options.data)
    .accounts({
      forumConfig,
      merkleTree,
      mint,
      tokenAccount,
      metadata,
      author: wallet.publicKey,
      sessionToken: new web3.PublicKey(session.sessionToken!),
      additionalSigner: null,
      signer: session.publicKey!,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .transaction();

  const [signature] = await session.signAndSendTransaction!(
    transaction,
    connection,
    {
      preflightCommitment: "confirmed",
    }
  );
  console.log("Transaction sent: ", signature);

  return signature;
}

export async function getEventFromSignature(
  connection: web3.Connection,
  wallet: AnchorWallet,
  signature: string
) {
  const program = getCompressionProgram(connection, wallet);
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
  wallet: AnchorWallet,
  entry: PostWithCommentsCountAndForum | SerializedCommentNested
) {
  const program = getCompressionProgram(connection, wallet);

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

export async function likeEntry(
  connection: web3.Connection,
  wallet: AnchorWallet,
  options: {
    id: string;
    author: string;
  }
) {
  const program = getBloomProgram(connection, wallet);
  const entryId = new web3.PublicKey(options.id);
  const author = new web3.PublicKey(options.author);
  const bloomPda = findBloomPda(entryId, author);
  const authorTokenAccount = await findEscrowTokenPda(author);
  const depositTokenAccount = await findEscrowTokenPda(wallet.publicKey);

  await program.methods
    .feedPlankton(entryId, new BN(100_000))
    .accounts({
      payer: wallet.publicKey,
      author,
      sessionToken: null,
      authorTokenAccount,
      depositTokenAccount,
      bloom: bloomPda,
      mint: PLANKTON_MINT,
      protocolFeeTokenAccount: PROTOCOL_FEE_PLANKTON_ATA,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function claimPlankton(
  connection: web3.Connection,
  wallet: AnchorWallet
) {
  const program = getBloomProgram(connection, wallet);
  const escrowTokenAccount = await findEscrowTokenPda(wallet.publicKey);
  const rewardTokenAccount = await findRewardEscrowPda();
  const claimMarker = await findClaimMarkerPda(wallet.publicKey);

  await program.methods
    .claimPlankton()
    .accounts({
      signer: wallet.publicKey,
      escrowTokenAccount,
      rewardTokenAccount,
      claimMarker,
      mint: PLANKTON_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc({
      commitment: "confirmed",
    });
}

export async function updateProfile(
  connection: web3.Connection,
  wallet: AnchorWallet,
  options: {
    name: string;
    mint: string;
  }
) {
  const program = getProfileProgram(connection, wallet);
  const mint = new web3.PublicKey(options.mint);
  const metadataPda = findMetadataPda(mint);
  const profilePda = findProfilePda(wallet.publicKey);

  const tokenAccount = await connection
    .getTokenLargestAccounts(mint)
    .then(
      (result) =>
        result.value.find((account) => Number(account.amount) > 0)?.address
    );

  await program.methods
    .updateProfile(options.name)
    .accounts({
      mint,
      tokenAccount,
      author: wallet.publicKey,
      profile: profilePda,
      metadata: metadataPda,
    })
    .rpc();
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

function assertSessionIsValid(session: SessionWalletInterface) {
  if (!session.sessionToken) {
    throw new Error("Session token not found");
  }

  if (!session.publicKey) {
    throw new Error("Session publicKey not found");
  }

  if (!session.ownerPublicKey) {
    throw new Error("Session owner not found");
  }

  if (!session.signAndSendTransaction) {
    throw new Error("Session signAndSendTransaction not found");
  }
}
