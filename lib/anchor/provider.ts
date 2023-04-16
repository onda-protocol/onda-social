import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { OndaSocial, IDL } from "./idl";

export const PROGRAM_ID = new anchor.web3.PublicKey(
  "5KCUQVLFg1E7SuZbuLNG5n5UAA6Gzxshdp1wnq9pNtyD"
);

export function getProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaSocial> {
  return new anchor.Program<OndaSocial>(
    IDL,
    PROGRAM_ID,
    wallet ? getProvider(connection, wallet) : undefined
  );
}

export function getProvider(
  connection: anchor.web3.Connection,
  wallet: AnchorWallet
): anchor.AnchorProvider {
  return new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
}
