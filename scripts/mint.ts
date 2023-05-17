import fs from "fs";
import {
  Metaplex,
  bundlrStorage,
  keypairIdentity,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const keypairJSON = fs.readFileSync(
  "/Users/grantfindlay/.config/solana/id.json",
  "utf-8"
);
const keypairArray = new Uint8Array(JSON.parse(keypairJSON));
const keypair = Keypair.fromSecretKey(keypairArray);
const metaplex = new Metaplex(connection).use(keypairIdentity(keypair)).use(
  bundlrStorage({
    address: "https://devnet.bundlr.network",
    providerUrl: "https://api.devnet.solana.com",
    identity: keypair,
  })
);

async function main() {
  console.log("keypair: ", keypair.publicKey.toBase58());
  const image = fs.readFileSync("./scripts/plankton.gif");
  const metaplexFile = toMetaplexFile(image, "plankton.gif");
  const imageUri = await metaplex.storage().upload(metaplexFile);
  const metadataUri = await metaplex.storage().uploadJson({
    name: "Plankton",
    symbol: "PLANK",
    description: "TODO",
    image: imageUri,
  });
  console.log("metadataUri: ", metadataUri);
  const sft = await metaplex.nfts().createSft({
    uri: metadataUri,
    name: "Plankton",
    decimals: 5,
    tokenStandard: 2, // Fungible
    sellerFeeBasisPoints: 0,
    symbol: "PLANK",
    isMutable: true,
  });
  console.log(sft);
  console.log("DONE.");
}

main();
