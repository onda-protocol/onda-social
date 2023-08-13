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
        "3frwJEq4Z8EGzKar4Y5eHHBKvzbHfdf1Cgjf37sRVAtdQaQXwhRU97aSoK7umUkkax4PcXDoXU5SEK1RRcv282St",
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
