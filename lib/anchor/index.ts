import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { OndaSocial, IDL } from "./idl";

const PROGRAM_ID = "62616yhPNbv1uxcGbs84pk9PmGbBaaEBXAZmLE6P1nGS";

export function getProgram(
  connection: anchor.web3.Connection,
  wallet: AnchorWallet
): anchor.Program<OndaSocial> {
  const provider = getProvider(connection, wallet);
  return new anchor.Program<OndaSocial>(IDL, PROGRAM_ID, provider);
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
