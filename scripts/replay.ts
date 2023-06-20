import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import enhancedTransactionParser from "../lib/parser";

const apiKey = process.env.HELIUS_API_KEY;
const url = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;

async function main() {
  const { data } = await axios.post(url, {
    transactions: [
      "4EMKhcibCC9kCYTRFyK7LkExd4qvJmyibSyGGeMz8zoie5fKw63aoTQCYnBMZ6RAEyK7EncYc8aWZgCJtP4WTkdU",
    ],
  });
  await enhancedTransactionParser(data);
}

main();
