import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;

async function main() {
  const { data: entries } = await axios.post(
    `https://api-devnet.helius.xyz/v0/transactions/?api-key=${apiKey}`,
    {
      transactions: [
        "bnPeiR7VKaLwwXGd4bBN4kSPKgvr2nZxnaeDaAPssRkWpDJEs4ERerya3LDFouiovN44YRCKfN9jLELXi8szsV3",
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const sortedEntryTxs = entries.sort(
    (a: any, b: any) => a.timestamp - b.timestamp
  );

  await enhancedTransactionParser(sortedEntryTxs);
}

main();
