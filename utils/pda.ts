import { web3, BN } from "@project-serum/anchor";
import {
  COMPRESSION_PROGRAM_ID,
  MODERATION_PROGRAM_ID,
  NAMESPACE_PROGRAM_ID,
  AWARDS_PROGRAM_ID,
  BUBBLEGUM_PROGRAM_ID,
  METADATA_PROGRAM_ID,
} from "../lib/anchor/constants";

export function findMetadataPda(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  )[0];
}

export function findEditionPda(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  )[0];
}

export function findCollectionAuthorityRecordPda(
  mint: web3.PublicKey,
  collectionAuthority: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("collection_authority"),
      collectionAuthority.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )[0];
}

export function findEntryId(merkleTree: web3.PublicKey, entryIndex: number) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("entry"),
      merkleTree.toBuffer(),
      new BN(entryIndex).toBuffer("le", 8),
    ],
    COMPRESSION_PROGRAM_ID
  )[0];
}

export function findForumConfigPda(merkleTree: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    COMPRESSION_PROGRAM_ID
  )[0];
}

export function findTeamPda(merkleTree: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("team"), merkleTree.toBuffer()],
    MODERATION_PROGRAM_ID
  )[0];
}

export function findNamespacePda(name: string) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("namespace"), Buffer.from(name)],
    NAMESPACE_PROGRAM_ID
  )[0];
}

export function findTreeMarkerPda(merkleTree: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("tree_marker"), merkleTree.toBuffer()],
    NAMESPACE_PROGRAM_ID
  )[0];
}

export function findAwardPda(merkleTree: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    AWARDS_PROGRAM_ID
  )[0];
}

export function findClaimPda(
  matchingAward: web3.PublicKey,
  recipient: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("claim"), matchingAward.toBuffer(), recipient.toBuffer()],
    AWARDS_PROGRAM_ID
  )[0];
}

export function findTreeAuthorityPda(merkleTree: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )[0];
}

export function findBubblegumSignerPda() {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi")],
    BUBBLEGUM_PROGRAM_ID
  )[0];
}
