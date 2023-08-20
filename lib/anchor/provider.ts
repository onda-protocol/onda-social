import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { OndaCompression, IDL as CompressionIDL } from "./idl/onda_compression";
import { OndaProfile, IDL as ProfileIDL } from "./idl/onda_profile";
import { OndaModeration, IDL as ModerationIDL } from "./idl/onda_moderation";
import { OndaNamespace, IDL as NamespaceIDL } from "./idl/onda_namespace";
import { OndaAwards, IDL as AwardsIDL } from "./idl/onda_awards";
import {
  AWARDS_PROGRAM_ID,
  COMPRESSION_PROGRAM_ID,
  NAMESPACE_PROGRAM_ID,
  PROFILE_PROGRAM_ID,
} from "./constants";

export function getCompressionProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaCompression> {
  return new anchor.Program<OndaCompression>(
    CompressionIDL,
    COMPRESSION_PROGRAM_ID,
    getProvider(connection, wallet)
  );
}

export function getProfileProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaProfile> {
  return new anchor.Program<OndaProfile>(
    ProfileIDL,
    PROFILE_PROGRAM_ID,
    getProvider(connection, wallet)
  );
}

export function getModerationProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaModeration> {
  return new anchor.Program<OndaModeration>(
    ModerationIDL,
    PROFILE_PROGRAM_ID,
    getProvider(connection, wallet)
  );
}

export function getNamespaceProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaNamespace> {
  return new anchor.Program<OndaNamespace>(
    NamespaceIDL,
    NAMESPACE_PROGRAM_ID,
    getProvider(connection, wallet)
  );
}

export function getAwardsProgram(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.Program<OndaAwards> {
  return new anchor.Program<OndaAwards>(
    AwardsIDL,
    AWARDS_PROGRAM_ID,
    getProvider(connection, wallet)
  );
}

class MockWallet implements anchor.Wallet {
  constructor(readonly payer: anchor.web3.Keypair) {}

  async signTransaction(
    tx: anchor.web3.Transaction
  ): Promise<anchor.web3.Transaction> {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions(
    txs: anchor.web3.Transaction[]
  ): Promise<anchor.web3.Transaction[]> {
    return txs.map((t) => {
      t.partialSign(this.payer);
      return t;
    });
  }

  get publicKey(): anchor.web3.PublicKey {
    return this.payer.publicKey;
  }
}

export function getProvider(
  connection: anchor.web3.Connection,
  wallet?: AnchorWallet
): anchor.AnchorProvider {
  return new anchor.AnchorProvider(
    connection,
    wallet ?? new MockWallet(anchor.web3.Keypair.generate()),
    {
      preflightCommitment: "confirmed",
      commitment: "confirmed",
    }
  );
}
