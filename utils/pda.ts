import { web3, BN } from "@project-serum/anchor";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { PROGRAM_ID } from "lib/anchor";

export function findMetadataPda(mint: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
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
    PROGRAM_ID
  )[0];
}

export function findLikeRecordPda(
  entryId: web3.PublicKey,
  author: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("likes"), entryId.toBuffer(), author.toBuffer()],
    PROGRAM_ID
  )[0];
}
