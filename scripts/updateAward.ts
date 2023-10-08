import fs from "fs";
import path from "path";
import os from "os";
import * as dotenv from "dotenv";
import * as anchor from "@project-serum/anchor";
import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
  toMetaplexFile,
} from "@metaplex-foundation/js";

dotenv.config();

const SYMBOL = "GIGABRAIN";
const NAME = "The Gigabrain Glass Eater";
const DESCRIPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const MINT_ADDRESS = "HXQHBSvNg1ridkmRfnNMboEi5wfTZQLZutzwKVbrbqfh";
const ATTRS = [
  {
    trait_type: "brain",
    value: "gigabrain",
  },
  {
    trait_type: "eats",
    value: "glass",
  },
];
const IMAGE = path.join(__dirname, "../public/glasseater-dark.png");

const connection = new anchor.web3.Connection(
  process.env.HELIUS_RPC_URL as string
);

function getSigner() {
  const json = fs.readFileSync(
    os.homedir() + "/.config/solana/id.json",
    "utf-8"
  );
  const secretKey = Uint8Array.from(JSON.parse(json));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

async function updateCollectionMetadata(
  authority: anchor.web3.Keypair,
  mintAddress: string,
  metadataUri: string
) {
  const metaplex = new Metaplex(connection).use(keypairIdentity(authority));

  const result = await metaplex.nfts().findByMint({
    mintAddress: new anchor.web3.PublicKey(mintAddress),
  });
  await metaplex.nfts().update({
    nftOrSft: result,
    symbol: SYMBOL,
    name: NAME,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
  });
  console.log("OK");
}

async function uploadMetadata(authority: anchor.web3.Keypair) {
  const metaplex = new Metaplex(connection).use(keypairIdentity(authority)).use(
    bundlrStorage({
      address: process.env.NEXT_PUBLIC_BUNDLR_URL!,
    })
  );

  const file = fs.readFileSync(IMAGE);
  const metaplexFile = toMetaplexFile(file, "image/png");
  const imageUri = await metaplex.storage().upload(metaplexFile);
  const metadataUri = await metaplex.storage().uploadJson({
    symbol: SYMBOL,
    name: NAME,
    description: DESCRIPTION,
    image: imageUri,
    external_url: "https://onda.community",
    attributes: ATTRS,
    properties: {
      files: [
        {
          uri: imageUri,
          type: "image/png",
        },
      ],
    },
  });

  return metadataUri;
}

async function main() {
  const signer = getSigner();
  const metadataUri = await uploadMetadata(signer);
  await updateCollectionMetadata(signer, MINT_ADDRESS, metadataUri);
}

main();
