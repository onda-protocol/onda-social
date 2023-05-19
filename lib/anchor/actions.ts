import { web3, BN } from "@project-serum/anchor";
import {
  AccountLayout,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import base58 from "bs58";

import {
  findForumConfigPda,
  findBloomPda,
  findMetadataPda,
  findProfilePda,
} from "utils/pda";
import { fetchAllAccounts } from "utils/web3";
import { DataV1, LeafSchemaV1 } from "./types";
import {
  getCompressionProgram,
  getBloomProgram,
  getProfileProgram,
} from "./provider";
import { PLANKTON_MINT, PROTOCOL_FEE_PLANKTON_ATA } from "./constants";

export async function initForum(
  connection: web3.Connection,
  wallet: AnchorWallet
) {
  const program = getCompressionProgram(connection, wallet);
  const payer = program.provider.publicKey;

  if (!payer || !program.provider.sendAndConfirm) {
    throw new Error("Provider not found");
  }

  const maxDepth = 20;
  const maxBufferSize = 256;
  const merkleTreeKeypair = web3.Keypair.generate();
  const merkleTree = merkleTreeKeypair.publicKey;
  const forumConfig = findForumConfigPda(merkleTree);
  const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  console.log("Allocating ", space, " bytes for merkle tree");
  console.log(lamports, " lamports required for rent exemption");
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

  const initIx = await program.methods
    .initForum(maxDepth, maxBufferSize, {
      collection: {
        /// Chicken Tribe Collection
        address: new web3.PublicKey(
          "FcAQivai8rtj48MbuEvRf94Yqymz6N9bkxcudpgRqgcJ"
        ),
      },
    })
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
  options: {
    forumId: string;
    forumConfig: string;
    collection: string | null;
    data: DataV1;
  }
): Promise<[string, string] | void> {
  const program = getCompressionProgram(connection, wallet);
  const payer = program.provider.publicKey;

  if (!payer || !program.provider.sendAndConfirm) {
    throw new Error("Provider not found");
  }

  const merkleTree = new web3.PublicKey(options.forumId);
  const forumConfig = new web3.PublicKey(options.forumConfig);
  const collection = options.collection
    ? new web3.PublicKey(options.collection)
    : undefined;

  let mint, metadata, tokenAccount;

  if (collection) {
    [mint, metadata, tokenAccount] = await fetchTokenAccounts(
      connection,
      wallet.publicKey,
      collection
    );
  }
  // TODO! Properly handle different post types
  let totalSize = 0;

  if (options.data.textPost) {
    const encodedTitle = Buffer.from(options.data.textPost.title, "utf-8");
    const encodedBody = Buffer.from(options.data.textPost.body, "utf-8");
    totalSize = encodedTitle.byteLength + encodedBody.byteLength;
  } else if (options.data.comment) {
    const encodedBody = Buffer.from(options.data.comment.body, "utf-8");
    totalSize = encodedBody.byteLength;
  }

  if (totalSize > 1000) {
    throw new Error("Post too long - max length is 1000 bytes (for now)");
  }

  const signature = await program.methods
    .addEntry(options.data)
    .accounts({
      forumConfig,
      merkleTree,
      mint,
      tokenAccount,
      metadata,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .rpc({
      commitment: "confirmed",
    });

  const logs = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 2,
  });

  const innerInstructions = logs?.meta?.innerInstructions?.[0];
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
  const authorTokenAccount = await getAssociatedTokenAddress(
    PLANKTON_MINT,
    author
  );
  const depositTokenAccount = await getAssociatedTokenAddress(
    PLANKTON_MINT,
    wallet.publicKey
  );

  await program.methods
    .feedPlankton(entryId, new BN(100_000))
    .accounts({
      author,
      authorTokenAccount,
      depositTokenAccount,
      payer: wallet.publicKey,
      bloom: bloomPda,
      mint: PLANKTON_MINT,
      protocolFeeTokenAccount: PROTOCOL_FEE_PLANKTON_ATA,
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
  collection: web3.PublicKey
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
    metadata.collection?.key.equals(collection)
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
