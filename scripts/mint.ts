import fs from "fs";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const keypairJSON = fs.readFileSync(
  "/Users/grantfindlay/.config/solana/id.json",
  "utf-8"
);
const keypairArray = new Uint8Array(JSON.parse(keypairJSON));
const keypair = Keypair.fromSecretKey(keypairArray);
const metaplex = new Metaplex(connection).use(keypairIdentity(keypair));

async function main() {
  console.log("keypair: ", keypair.publicKey.toBase58());
}

main();
