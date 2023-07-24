import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;
// onda3Sxku2NT88Ho8WfEgbkavNEELWzaguvh4itdn3C - bloom
// ondapcq2qXTSynRieMCE9BjRsZ2XALEEZZunkwbhCPF - profile
// ondaUaJpDBZZQzpGe5Tr391CbuJH1UpZuRcS7sZU2GB - compression
async function main() {
  // const { data: profiles } = await axios.get(
  //   `https://api-devnet.helius.xyz/v0/addresses/ondapcq2qXTSynRieMCE9BjRsZ2XALEEZZunkwbhCPF/transactions?api-key=${apiKey}&limit=1000`
  // );
  // const sortedProfileTxs = profiles.sort(
  //   (a: any, b: any) => a.timestamp - b.timestamp
  // );
  // await enhancedTransactionParser(sortedProfileTxs);
  const { data: entries } = await axios.post(
    // `https://api-devnet.helius.xyz/v0/addresses/ondaUaJpDBZZQzpGe5Tr391CbuJH1UpZuRcS7sZU2GB/transactions?api-key=${apiKey}&limit=1000`
    `https://api-devnet.helius.xyz/v0/transactions/?api-key=${apiKey}`,
    {
      transactions: [
        "faifWLVt8GrNRUYu5RTZmCVvxE4FBsKMf33rVAbns7EbjeE63aidBtepK5Ycvpm9etKFydCitFtPhx1XQyjwdcz",
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
