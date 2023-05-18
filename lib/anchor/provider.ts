import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { OndaBloom, IDL as BloomIDL } from "./idl/onda_bloom";
import { OndaCompression, IDL as CompressionIDL } from "./idl/onda_compression";
import { OndaProfile, IDL as ProfileIDL } from "./idl/onda_profile";
import {
  BLOOM_PROGRAM_ID,
  COMPRESSION_PROGRAM_ID,
  PROFILE_PROGRAM_ID,
} from "./constants";

export function getBloomProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaBloom> {
  return new anchor.Program<OndaBloom>(
    BloomIDL,
    BLOOM_PROGRAM_ID,
    wallet ? getProvider(connection, wallet) : undefined
  );
}

export function getCompressionProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaCompression> {
  return new anchor.Program<OndaCompression>(
    CompressionIDL,
    COMPRESSION_PROGRAM_ID,
    wallet ? getProvider(connection, wallet) : undefined
  );
}

export function getProfileProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaProfile> {
  return new anchor.Program<OndaProfile>(
    ProfileIDL,
    PROFILE_PROGRAM_ID,
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
