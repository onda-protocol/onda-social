import { web3 } from "@project-serum/anchor";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
  findLikeRecordPda,
  findMetadataPda,
  findProfilePda,
} from "utils/pda";
import { fetchAllAccounts } from "utils/web3";
import { DataV1, LeafSchemaV1 } from "./types";
import { getProgram } from "./provider";

export async function initForum(
  connection: web3.Connection,
  wallet: AnchorWallet
) {
  const program = getProgram(connection, wallet);
  const payer = program.provider.publicKey;

  if (!payer || !program.provider.sendAndConfirm) {
    throw new Error("Provider not found");
  }

  const maxDepth = 14;
  const maxBufferSize = 64;
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
        address: new web3.PublicKey(
          "EotJ4wYtYQUbx6E2Tn5aAbsr79KBFRcwj5usriv2Xj7i"
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
  const program = getProgram(connection, wallet);
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
    .rpc({ commitment: "confirmed" });

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
  const program = getProgram(connection, wallet);
  const entryId = new web3.PublicKey(options.id);
  const author = new web3.PublicKey(options.author);
  const likeRecordPda = findLikeRecordPda(entryId, author);

  await program.methods
    .likeEntry(entryId)
    .accounts({
      payer: wallet.publicKey,
      author: author,
      likeRecord: likeRecordPda,
    })
    .rpc();
}

export async function updateProfile(
  connection: web3.Connection,
  wallet: AnchorWallet,
  options: {
    name: string;
    mint: string;
  }
) {
  const program = getProgram(connection, wallet);
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
  const metadataPdas = decodedTokenAccounts.map((account) =>
    findMetadataPda(account.mint)
  );
  const metadataAccounts = await fetchAllAccounts(connection, metadataPdas);
  const metadata = metadataAccounts
    .map((account) => {
      try {
        return Metadata.fromAccountInfo(account)[0];
      } catch (err) {
        console.log("err: ", err);
        return null;
      }
    })
    .filter((metadata): metadata is NonNullable<Metadata> => metadata !== null);
  const selectedMetadataAccount = metadata.find((metadata) =>
    metadata.collection?.key.equals(collection)
  );
  const selectedMintAddress = selectedMetadataAccount?.mint;

  if (!selectedMintAddress) {
    throw new Error("Unahthorized");
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