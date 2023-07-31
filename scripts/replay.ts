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
        "43TpotaTpyq3EYMpfDwEVLgX4zPBA2hLJZw7qmuxfarfsCG7Scbu2MXFQEDcNbgNZGH2NuxiiSUrcwBHwmwduSiQ",
        "3Zw22Yer7oLoZv5hHCeLV6n8J7WbUfX1oM9G9kLz21zFoKq1unHubeVo4hRMNobavSf3jq3BKZbBKq7oXoGy6Qoy",
        "5t4gXbEhVdwqMCZ5yBiaSYCn47Cbgc3ZFYBQQXMhJDJ3SdHmX5nHBLpEPUiLzQbUxgxHUMHYfH1WY8oXXFENzY91",
        "2o44beeGcUtv4o2YWP3YAnnu4SubhvDYdRqbqK3YsfYsHFXYLKiMnHZTJHJf5kKqRvyFUE2w6f8NJKL2kmzvRDPs",
        "4uEgXS4EFAHJgAmWkAHYXYWoSK8qZiA7mMAYcihz6nQa2Lr8LQ92wSfwPnmwvGcBgao1KMhfKqqqtgHvt2V6K5ma",
        "o61GY6vFgJtVNCvuyhBP2BkfQwGMxziyPz6DCVXhjMxb1QRBjuqa2GkpUdtkXRbWtkaZqqGytyHAfSj17WpiRpH",
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
