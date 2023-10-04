import fs from "fs";
import os from "os";
import * as dotenv from "dotenv";
import * as anchor from "@project-serum/anchor";
import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import {
  BUBBLEGUM_PROGRAM_ID,
  METADATA_PROGRAM_ID,
} from "../lib/anchor/constants";
import { getAwardsProgram } from "../lib/anchor/provider";
import { findAwardPda, findTreeAuthorityPda } from "../utils/pda";
import award from "./award";

dotenv.config();

const connection = new anchor.web3.Connection(
  process.env.HELIUS_RPC_URL as string
);
const program = getAwardsProgram(connection);

function getSigner() {
  const json = fs.readFileSync(
    os.homedir() + "/.config/solana/id.json",
    "utf-8"
  );
  const secretKey = Uint8Array.from(JSON.parse(json));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

async function createAward(
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
    .createAward(maxDepth, bufferSize, {
      amount: new anchor.BN(award.amount),
      public: award.public,
      feeBasisPoints: award.feeBasisPoints,
    })
    .accounts({
      award: accounts.awardPda,
      matchingAward: award.matchingAward
        ? new anchor.web3.PublicKey(award.matchingAward)
        : null,
      treasury: authority.publicKey,
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
    instructions: [
      anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000,
      }),
      allocTreeIx,
      createRewardIx,
    ],
  }).compileToV0Message();

  const transaction = new anchor.web3.VersionedTransaction(messageV0);

  try {
    await transaction.sign([authority, merkleTree]);
    const signature = await connection.sendTransaction(transaction, {
      // skipPreflight: true,
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
  merkleTree: anchor.web3.Keypair,
  metadataUri: string
) {
  const metaplex = new Metaplex(connection).use(keypairIdentity(authority));

  const transactionBuilder = await metaplex.nfts().builders().create({
    symbol: award.symbol,
    name: award.name,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    isCollection: true,
  });
  const context = transactionBuilder.getContext();
  const mintAddress = context.mintAddress;
  const metadataAddress = context.metadataAddress;
  const masterEditionAddress = context.masterEditionAddress;
  const awardPda = findAwardPda(merkleTree.publicKey);

  const collectionAuthorityRecordPda = await metaplex
    .nfts()
    .pdas()
    .collectionAuthorityRecord({
      mint: mintAddress,
      collectionAuthority: awardPda,
    });

  try {
    const result = await transactionBuilder.sendAndConfirm(metaplex);
    console.log("txId: ", result.response.signature);
  } catch (err) {
    console.log(err);
    throw err;
  }

  return {
    awardPda,
    collectionAuthorityRecordPda,
    collectionMetadata: metadataAddress,
    collectionMint: mintAddress,
    editionPda: masterEditionAddress,
  };
}

async function uploadMetadata(authority: anchor.web3.Keypair) {
  const metaplex = new Metaplex(connection).use(keypairIdentity(authority)).use(
    bundlrStorage({
      address: process.env.NEXT_PUBLIC_BUNDLR_URL!,
    })
  );

  const file = fs.readFileSync(award.image);
  const metaplexFile = toMetaplexFile(file, "image/png");
  const imageUri = await metaplex.storage().upload(metaplexFile);
  const metadataUri = await metaplex.storage().uploadJson({
    name: award.name,
    symbol: award.symbol,
    image: imageUri,
    external_url: "https://onda.community",
    attributes: {
      trait_type: "glass",
      value: "chewed",
    },
    properties: {
      files: [
        {
          uri: imageUri,
          type: "image/png",
        },
      ],
    },
  });
  console.log("metadataUri: ", metadataUri);

  return metadataUri;
}

async function main() {
  const signer = getSigner();
  const merkleTree = anchor.web3.Keypair.generate();

  const metadataUri = await uploadMetadata(signer);
  const accounts = await createCollectionMint(signer, merkleTree, metadataUri);
  await createAward(signer, merkleTree, accounts);
}

main();
