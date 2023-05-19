import type { NextApiRequest, NextApiResponse } from "next";
import enhancedTransactionParser from "lib/parser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // IMPORTANT! Uncomment this line to enable webhook auth
  if (req.headers.authorization !== process.env.WEBHOOK_AUTH_TOKEN) {
    res.status(401).end();
    return;
  }

  await enhancedTransactionParser(req.body);

  res.status(200).end();
}
