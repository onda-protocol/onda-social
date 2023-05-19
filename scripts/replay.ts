import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const programId = "ondac1bD7BYSbqf2jifdthJYADkGuN4NkMZNYjuopn3";
const apiKey = process.env.HELIUS_API_KEY;
const url = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;

async function main() {
  const { data } = await axios.post(url, {
    transactions: [
      "TJyAxCXbSFo5TzgnjHo13VBxbnymcvAUJwdKwfQMbfzTzsotX1jYUzDKMQp4NA7mHGJNCnfWEdZxY4RHWoeAJXT",
    ],
  });
  await enhancedTransactionParser(data);
}

main();
