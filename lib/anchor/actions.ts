import { web3 } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "./provider";
import { findEntryId, findLikeRecordPda } from "utils/pda";

export async function likeEntry(
  connection: web3.Connection,
  wallet: AnchorWallet,
  {
    author,
    forumConfig,
    merkleTree,
    nonce,
  }: {
    author: web3.PublicKey;
    forumConfig: web3.PublicKey;
    merkleTree: web3.PublicKey;
    nonce: number;
  }
) {
  const program = getProgram(connection, wallet);
  const entryId = findEntryId(merkleTree, nonce);
  const likeRecordPda = findLikeRecordPda(entryId, author);

  await program.methods
    .likeEntry(entryId)
    .accounts({
      payer: wallet.publicKey,
      author: author,
      forumConfig,
      merkleTree,
      likeRecord: likeRecordPda,
    })
    .rpc();
}
