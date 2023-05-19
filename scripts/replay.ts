import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const programId = "ondac1bD7BYSbqf2jifdthJYADkGuN4NkMZNYjuopn3";
const apiKey = process.env.HELIUS_API_KEY;
const url = `https://api.helius.xyz/v0/addresses/${programId}/transactions?api-key=${apiKey}`;

async function main() {
  console.log("url: ", url);
  const { data } = await axios.get(url);
  await enhancedTransactionParser(data);
}

main();
