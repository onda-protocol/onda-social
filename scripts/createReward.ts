import fs from "fs";
import os from "os";
import * as dotenv from "dotenv";
import * as anchor from "@project-serum/anchor";
import { keypairIdentity, Metaplex } from "@metaplex-foundation/js";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { BUBBLEGUM_PROGRAM_ID } from "../lib/anchor/constants";
import { getRewardsProgram } from "../lib/anchor/provider";
import { findRewardPda, findTreeAuthorityPda } from "../utils/pda";

dotenv.config();

const connection = new anchor.web3.Connection(
  process.env.HELIUS_RPC_URL as string
);
const program = getRewardsProgram(connection);

function getSigner() {
  const json = fs.readFileSync(
    os.homedir() + "/.config/solana/id.json",
    "utf-8"
  );
  const secretKey = Uint8Array.from(JSON.parse(json));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

async function createReward(
  authority: anchor.web3.Keypair,
  merkleTree: anchor.web3.Keypair,
  accounts: Awaited<ReturnType<typeof createCollectionMint>>
) {
  const maxDepth = 14;
  const bufferSize = 64;
  const canopyDepth = maxDepth - 3;
  const space = getConcurrentMerkleTreeAccountSize(
    maxDepth,
    bufferSize,
    canopyDepth
  );
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  const allocTreeIx = anchor.web3.SystemProgram.createAccount({
    lamports,
    space: space,
    fromPubkey: authority.publicKey,
    newAccountPubkey: merkleTree.publicKey,
    programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  });
  const treeAuthorityPda = findTreeAuthorityPda(merkleTree.publicKey);

  const createRewardIx = await program.methods
    .createReward(maxDepth, bufferSize, {
      symbol: "PLANK",
      name: "Plankton",
      uri: "https://arweave.net/r1Y2R-KIE71TdOGCah4qQ8pTLjBn1WEETxqD8b7X8Lc",
    })
    .accounts({
      reward: accounts.rewardPda,
      collectionMint: accounts.collectionMint,
      collectionMetadata: accounts.collectionMetadata,
      collectionAuthorityRecord: accounts.collectionAuthorityRecordPda,
      merkleTree: merkleTree.publicKey,
      treeAuthority: treeAuthorityPda,
      payer: authority.publicKey,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
      tokenMetadataProgram: METADATA_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .instruction();

  let latestBlockhash = await connection.getLatestBlockhash();

  const messageV0 = new anchor.web3.TransactionMessage({
    payerKey: authority.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [allocTreeIx, createRewardIx],
  }).compileToV0Message();

  const transaction = new anchor.web3.VersionedTransaction(messageV0);

  try {
    await transaction.sign([authority, merkleTree]);
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: true,
      preflightCommitment: "confirmed",
    });
    console.log("txId: ", signature);
    const result = await connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    });
    console.log("result: ", result);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function createCollectionMint(
  authority: anchor.web3.Keypair,
  merkleTree: anchor.web3.Keypair
) {
  const metaplex = new Metaplex(connection).use(keypairIdentity(authority));

  const transactionBuilder = await metaplex.nfts().builders().create({
    symbol: "PLANK",
    name: "Planktonites",
    uri: "https://arweave.net/r1Y2R-KIE71TdOGCah4qQ8pTLjBn1WEETxqD8b7X8Lc",
    sellerFeeBasisPoints: 0,
    isCollection: true,
  });
  const context = transactionBuilder.getContext();
  const mintAddress = context.mintAddress;
  const metadataAddress = context.metadataAddress;
  const masterEditionAddress = context.masterEditionAddress;
  const rewardPda = findRewardPda(merkleTree.publicKey);

  const collectionAuthorityRecordPda = await metaplex
    .nfts()
    .pdas()
    .collectionAuthorityRecord({
      mint: mintAddress,
      collectionAuthority: rewardPda,
    });

  try {
    const result = await transactionBuilder.sendAndConfirm(metaplex);
    console.log("txId: ", result.response.signature);
  } catch (err) {
    console.log(err);
    throw err;
  }

  return {
    rewardPda,
    collectionAuthorityRecordPda,
    collectionMetadata: metadataAddress,
    collectionMint: mintAddress,
    editionPda: masterEditionAddress,
  };
}

async function main() {
  const signer = getSigner();
  const merkleTree = anchor.web3.Keypair.generate();

  const accounts = await createCollectionMint(signer, merkleTree);
  await createReward(signer, merkleTree, accounts);
}

main();
