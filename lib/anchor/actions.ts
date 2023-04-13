import { web3 } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "./provider";
import { findLikeRecordPda } from "utils/pda";

export async function likeEntry(
  connection: web3.Connection,
  wallet: AnchorWallet,
  options: {
    id: string;
    author: string;
    forumId: string;
    forumConfig: string;
  }
) {
  const program = getProgram(connection, wallet);
  const entryId = new web3.PublicKey(options.id);
  const author = new web3.PublicKey(options.author);
  const merkleTree = new web3.PublicKey(options.forumId);
  const forumConfigPda = new web3.PublicKey(options.forumConfig);
  const likeRecordPda = findLikeRecordPda(entryId, author);

  await program.methods
    .likeEntry(entryId)
    .accounts({
      payer: wallet.publicKey,
      author: author,
      merkleTree,
      forumConfig: forumConfigPda,
      likeRecord: likeRecordPda,
    })
    .rpc();
}
