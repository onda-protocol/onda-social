import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;
// onda3Sxku2NT88Ho8WfEgbkavNEELWzaguvh4itdn3C - bloom
// ondapcq2qXTSynRieMCE9BjRsZ2XALEEZZunkwbhCPF - profile
// ondaV4qqTUGbPR3m4XGi3YXf1NAXYCJEtuMKzVWBbSy - compression
async function main() {
  // const { data: profiles } = await axios.get(
  //   `https://api-devnet.helius.xyz/v0/addresses/ondapcq2qXTSynRieMCE9BjRsZ2XALEEZZunkwbhCPF/transactions?api-key=${apiKey}&limit=1000`
  // );
  // const sortedProfileTxs = profiles.sort(
  //   (a: any, b: any) => a.timestamp - b.timestamp
  // );
  // await enhancedTransactionParser(sortedProfileTxs);
  const { data: entries } = await axios.get(
    `https://api-devnet.helius.xyz/v0/addresses/ondaUaJpDBZZQzpGe5Tr391CbuJH1UpZuRcS7sZU2GB/transactions?api-key=${apiKey}&limit=1000`
  );
  const sortedEntryTxs = entries.sort(
    (a: any, b: any) => a.timestamp - b.timestamp
  );
  await enhancedTransactionParser(sortedEntryTxs);
}

main();
