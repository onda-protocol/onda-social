import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;
const url = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;

async function main() {
  const { data } = await axios.post(url, {
    transactions: [
      "2pAswcJA4A183VZDTMb73wQGqFq4h63hiiWCQPtQ1BqzSR9eCnUuQh7NyksU6sX8HtFj6zkZnk9c7V3zVSW77GYt",
    ],
  });
  await enhancedTransactionParser(data);
}

main();
