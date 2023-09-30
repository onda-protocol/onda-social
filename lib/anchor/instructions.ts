import { web3, BN } from "@project-serum/anchor";
import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

import {
  findForumConfigPda,
  findMetadataPda,
  findTreeAuthorityPda,
  findCollectionAuthorityRecordPda,
  findEditionPda,
  findBubblegumSignerPda,
} from "utils/pda";
import { DataV1 } from "./types";
import { BUBBLEGUM_PROGRAM_ID, METADATA_PROGRAM_ID } from "./constants";
import { getCompressionProgram, getAwardsProgram } from "./provider";

export async function addEntryIx(
  connection: web3.Connection,
  options: {
    author: web3.PublicKey;
    forum: web3.PublicKey;
    mint: web3.PublicKey | null;
    tokenAccount: web3.PublicKey | null;
    metadata: web3.PublicKey | null;
    data: DataV1;
  }
): Promise<web3.TransactionInstruction> {
  const program = getCompressionProgram(connection);
  const merkleTree = new web3.PublicKey(options.forum);
  const forumConfig = findForumConfigPda(merkleTree);

  const instruction = await program.methods
    .addEntry(options.data)
    .accounts({
      forumConfig,
      merkleTree,
      mint: options.mint,
      tokenAccount: options.tokenAccount,
      metadata: options.metadata,
      author: options.author,
      sessionToken: null,
      additionalSigner: null,
      signer: options.author,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .instruction();

  return instruction;
}

export async function deleteEntryIx(
  connection: web3.Connection,
  options: {
    author: web3.PublicKey;
    forum: web3.PublicKey;
    createdAt: number;
    editedAt: number | null;
    nonce: number;
    dataHash: number[];
    proof: string[];
  }
) {
  const program = getCompressionProgram(connection);
  const merkleTreeAddress = options.forum;
  const merkleTreeAccount =
    await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      merkleTreeAddress
    );
  const forumConfigAddress = findForumConfigPda(merkleTreeAddress);
  /**
   * root: [u8; 32],
   * created_at: i64,
   * edited_at: Option<i64>,
   * data_hash: [u8; 32],
   * nonce: u64,
   * index: u32,
   **/
  return program.methods
    .deleteEntry(
      Array.from(merkleTreeAccount.getCurrentRoot()),
      new BN(options.createdAt),
      options.editedAt ? new BN(options.editedAt) : null,
      options.dataHash,
      new BN(options.nonce),
      options.nonce
    )
    .accounts({
      signer: options.author,
      author: options.author,
      forumConfig: forumConfigAddress,
      merkleTree: merkleTreeAddress,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .remainingAccounts(
      options.proof.map((hash) => ({
        pubkey: new web3.PublicKey(hash),
        isWritable: false,
        isSigner: false,
      }))
    )
    .instruction();
}

export async function giveAwardIx(
  connection: web3.Connection,
  options: {
    entry: web3.PublicKey;
    payer: web3.PublicKey;
    recipient: web3.PublicKey;
    award: web3.PublicKey;
    claim: web3.PublicKey | null;
    treasury: web3.PublicKey;
    merkleTree: web3.PublicKey;
    collectionMint: web3.PublicKey;
    forumMerkleTree: web3.PublicKey;
    root: number[];
    createdAt: number;
    editedAt: number | null;
    dataHash: number[];
    nonce: number;
    proof: string[];
  }
) {
  const program = getAwardsProgram(connection);
  const collectionMetadataPda = findMetadataPda(options.collectionMint);
  const editionPda = findEditionPda(options.collectionMint);
  const treeAuthorityPda = findTreeAuthorityPda(options.merkleTree);
  const collectionAuthorityRecordPda = findCollectionAuthorityRecordPda(
    options.collectionMint,
    options.award
  );
  const bubblegumSignerPda = findBubblegumSignerPda();

  return program.methods
    .giveAward(
      options.root,
      new BN(options.createdAt),
      options.editedAt ? new BN(options.editedAt) : null,
      options.dataHash,
      options.nonce
    )
    .accounts({
      entryId: options.entry,
      forumMerkleTree: options.forumMerkleTree,
      award: options.award,
      treasury: options.treasury,
      merkleTree: options.merkleTree,
      payer: options.payer,
      recipient: options.recipient,
      claim: options.claim,
      treeAuthority: treeAuthorityPda,
      collectionAuthorityRecordPda,
      collectionMint: options.collectionMint,
      collectionMetadata: collectionMetadataPda,
      editionAccount: editionPda,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumSigner: bubblegumSignerPda,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      tokenMetadataProgram: METADATA_PROGRAM_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
    })
    .remainingAccounts(
      options.proof.map((hash) => ({
        pubkey: new web3.PublicKey(hash),
        isWritable: false,
        isSigner: false,
      }))
    )
    .instruction();
}

export async function claimAward(
  connection: web3.Connection,
  options: {
    award: web3.PublicKey;
    treasury: web3.PublicKey;
    claim: web3.PublicKey;
    recipient: web3.PublicKey;
    merkleTree: web3.PublicKey;
    collectionMint: web3.PublicKey;
  }
) {
  const program = getAwardsProgram(connection);
  const collectionMetadataPda = findMetadataPda(options.collectionMint);
  const editionPda = findEditionPda(options.collectionMint);
  const treeAuthorityPda = findTreeAuthorityPda(options.merkleTree);
  const collectionAuthorityRecordPda = findCollectionAuthorityRecordPda(
    options.collectionMint,
    options.award
  );
  const bubblegumSignerPda = findBubblegumSignerPda();

  return program.methods
    .claimAward()
    .accounts({
      treasury: options.treasury,
      recipient: options.recipient,
      award: options.award,
      claim: options.claim,
      merkleTree: options.merkleTree,
      treeAuthority: treeAuthorityPda,
      collectionAuthorityRecordPda: collectionAuthorityRecordPda,
      collectionMint: options.collectionMint,
      collectionMetadata: collectionMetadataPda,
      editionAccount: editionPda,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumSigner: bubblegumSignerPda,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      tokenMetadataProgram: METADATA_PROGRAM_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
    })
    .instruction();
}
