import { web3, BN } from "@project-serum/anchor";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  BLOOM_PROGRAM_ID,
  COMPRESSION_PROGRAM_ID,
  PROFILE_PROGRAM_ID,
  PLANKTON_MINT,
} from "../lib/anchor/constants";

export function findMetadataPda(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  )[0];
}

export function findBloomPda(entryId: web3.PublicKey, author: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bloom"), entryId.toBuffer(), author.toBuffer()],
    BLOOM_PROGRAM_ID
  )[0];
}

export function findEscrowTokenPda(owner: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), PLANKTON_MINT.toBuffer(), owner.toBuffer()],
    BLOOM_PROGRAM_ID
  )[0];
}

export function findRewardEscrowPda() {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("reward_escrow"), PLANKTON_MINT.toBuffer()],
    BLOOM_PROGRAM_ID
  )[0];
}

export function findClaimMarkerPda(owner: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("claim_marker"), owner.toBuffer()],
    BLOOM_PROGRAM_ID
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

export function findProfilePda(author: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), author.toBuffer()],
    PROFILE_PROGRAM_ID
  )[0];
}
