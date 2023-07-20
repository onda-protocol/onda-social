import { web3, BN } from "@project-serum/anchor";
import { PostType } from "@prisma/client";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
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
  findEscrowTokenPda,
  findRewardEscrowPda,
  findClaimMarkerPda,
} from "utils/pda";
import { fetchAllAccounts } from "utils/web3";
import { DataV1, LeafSchemaV1 } from "./types";
import {
  getCompressionProgram,
  getBloomProgram,
  getProfileProgram,
} from "./provider";
import { PLANKTON_MINT, PROTOCOL_FEE_PLANKTON_ATA } from "./constants";
import {
  PostWithCommentsCountAndForum,
  SerializedCommentNested,
  fetchProof,
} from "lib/api";

export async function initForum(
  connection: web3.Connection,
  wallet: AnchorWallet
) {
  const program = getCompressionProgram(connection, wallet);
  const payer = program.provider.publicKey;

  if (!payer || !program.provider.sendAndConfirm) {
    throw new Error("Provider not found");
  }

  const maxDepth = 18;
  const canopyDepth = 12;
  const maxBufferSize = 64;
  const merkleTreeKeypair = web3.Keypair.generate();
  const merkleTree = merkleTreeKeypair.publicKey;
  const forumConfig = findForumConfigPda(merkleTree);
  const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);
  const canopySpace = (Math.pow(2, canopyDepth) - 2) * 32;
  const totalSpace = space + canopySpace;
  const lamports = await connection.getMinimumBalanceForRentExemption(
    totalSpace
  );
  console.log("Allocating ", totalSpace, " bytes for merkle tree");
  console.log(
    lamports / web3.LAMPORTS_PER_SOL,
    " SOL required for rent exemption"
  );
  const allocTreeIx = web3.SystemProgram.createAccount({
    lamports,
    space: totalSpace,
    fromPubkey: payer,
    newAccountPubkey: merkleTree,
    programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  });

  const initIx = await program.methods
    .initForum(maxDepth, maxBufferSize, null)
    .accounts({
      payer,
      forumConfig,
      merkleTree,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .instruction();

  const tx = new web3.Transaction().add(allocTreeIx).add(initIx);
  tx.feePayer = payer;

  try {
    await program.provider.sendAndConfirm(tx, [merkleTreeKeypair], {
      commitment: "confirmed",
    });
  } catch (err) {
    // @ts-ignore
    console.log(err.logs);
    throw err;
  }

  console.log("Forum initialized");
  console.log("forumConfig: ", forumConfig.toBase58());
  console.log("merkleTree: ", merkleTree.toBase58());
}

export async function addEntry(
  connection: web3.Connection,
  wallet: AnchorWallet,
  session: SessionWalletInterface,
  options: {
    forumId: string;
    forumConfig: string;
    collections: string[] | null;
    data: DataV1;
  }
): Promise<[string, string] | void> {
  assertSessionIsValid(session);
  // @ts-ignore
  const program = getCompressionProgram(connection, wallet);
  const merkleTree = new web3.PublicKey(options.forumId);
  const forumConfig = new web3.PublicKey(options.forumConfig);
  const collections = options.collections
    ? options.collections.map((collection) => new web3.PublicKey(collection))
    : undefined;

  let mint = null;
  let metadata = null;
  let tokenAccount = null;

  if (collections?.length) {
    [mint, metadata, tokenAccount] = await fetchTokenAccounts(
      connection,
      wallet.publicKey,
      collections
    );
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
      signer: session.publicKey!,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .transaction();
  const signatures = await session.signAndSendTransaction!(
    transaction,
    connection,
    {
      preflightCommitment: "confirmed",
    }
  );

  console.log("Transaction sent: ", signatures);

  const response = await waitForConfirmation(connection, signatures[0]);
  const innerInstructions = response?.meta?.innerInstructions?.[0];

  if (innerInstructions) {
    const noopIx = innerInstructions.instructions[0];
    const serializedEvent = noopIx.data;
    const event = base58.decode(serializedEvent);
    const eventBuffer = Buffer.from(event.slice(8));
    const eventData: LeafSchemaV1 = program.coder.types.decode(
      "LeafSchema",
      eventBuffer
    ).v1;

    if (eventData) {
      return [eventData.id.toBase58(), eventData.nonce.toString()];
    }
  }
}

function waitForConfirmation(
  connection: web3.Connection,
  signature: string,
  retries: number = 0
): Promise<web3.VersionedTransactionResponse | undefined> {
  return new Promise(async (resolve, reject) => {
    const logs = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 2,
    });

    if (logs) {
      return resolve(logs);
    }

    if (retries > 3) {
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
        console.log({
          textPost: {
            title: entry.title,
            uri: entry.uri,
          },
        });
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

async function submitInstructions(
  connection: web3.Connection,
  instructions: web3.TransactionInstruction[],
  payer: web3.PublicKey,
  signers: web3.Signer[]
) {
  const latestBlockhash = await connection.getLatestBlockhash();
  const message = new web3.TransactionMessage({
    instructions,
    payerKey: payer,
    recentBlockhash: latestBlockhash.blockhash,
  }).compileToV0Message();
  const transaction = new web3.VersionedTransaction(message);
  transaction.sign(signers);
  const signature = await connection.sendTransaction(transaction);
  await connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  });
}

async function fetchTokenAccounts(
  connection: web3.Connection,
  owner: web3.PublicKey,
  collections: web3.PublicKey[]
) {
  const tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
  const decodedTokenAccounts = tokenAccounts.value.map((value) => ({
    ...AccountLayout.decode(value.account.data),
    pubkey: value.pubkey,
  }));
  const metadata = await fetchMetadataAccounts(
    connection,
    decodedTokenAccounts.map((value) => value.mint)
  );

  const selectedMetadataAccount = metadata.find((metadata) =>
    collections.some((collection) =>
      metadata.collection?.key.equals(collection)
    )
  );
  const selectedMintAddress = selectedMetadataAccount?.mint;

  if (!selectedMintAddress) {
    throw new Error("Unauthorized");
  }

  const selectedMetadataPda = findMetadataPda(selectedMetadataAccount.mint);
  const selectedTokenAddress = decodedTokenAccounts.find((value) =>
    value.mint.equals(selectedMetadataAccount.mint)
  )?.pubkey;

  if (!selectedTokenAddress) {
    throw new Error("Token account not found");
  }

  return [
    selectedMintAddress,
    selectedMetadataPda,
    selectedTokenAddress,
  ] as const;
}

async function fetchMetadataAccounts(
  connection: web3.Connection,
  mints: web3.PublicKey[]
) {
  const metadataAddresses = mints.map((mint) => findMetadataPda(mint));
  const rawMetadataAccounts = await fetchAllAccounts(
    connection,
    metadataAddresses
  );

  return rawMetadataAccounts
    .map((account) => (account ? Metadata.fromAccountInfo(account)[0] : null))
    .filter((metadata): metadata is NonNullable<Metadata> => metadata !== null);
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
