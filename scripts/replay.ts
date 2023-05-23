import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;
const url = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;

async function main() {
  const { data } = await axios.post(url, {
    transactions: [
      "91D3oSqcqWFD6R57Yy4khKUuQxAD7EVQxZfYZ5Rg2GoyPtWgBJz2uQSL73Ro2ZESEQsnH64N9WtaXsGx6ZMSfHb",
    ],
  });
  await enhancedTransactionParser(data);
}

main();
