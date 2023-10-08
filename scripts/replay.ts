import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;
// 5ECccixP2vUCsVi7LjUyzxmKfvq3VmwV6HioZof5coaZF8vD8os7ivRFMX4ktJbfGE85NXNaceUCxSkqwooJdzPK
// d4iHbCNHmsA99CUz36fodaQnwyuSy2a8B41Pd9a9xE15RKMpCYWFUGXgGSujjk2ccgmCNWtjqDpsoCmAZorr2gU
async function main() {
  const args = process.argv.slice(2);
  const txIdIndex = args.indexOf("--signature");
  const signature = args[txIdIndex + 1];

  if (!signature) {
    throw new Error("Transaction ID not provided.");
  }

  const { data: entries } = await axios.post(
    `https://api-devnet.helius.xyz/v0/transactions/?api-key=${apiKey}`,
    {
      transactions: [signature],
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
