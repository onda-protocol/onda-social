import type { NextApiRequest, NextApiResponse } from "next";
import { web3 } from "@project-serum/anchor";
import base58 from "bs58";

import { upload } from "lib/bundlr";

const MAX_UPLOAD_SIZE_BYTES = 100_000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = req.body.data as string;
  const byteLength = Buffer.from(data, "utf-8").byteLength;

  if (byteLength > MAX_UPLOAD_SIZE_BYTES) {
    return res.status(413).send("Content Too Large");
  }

  const keypair = web3.Keypair.fromSecretKey(
    base58.decode(process.env.SIGNER_SECRET_KEY as string)
  );
  const uri = await upload(keypair, data, "application/json");

  res.json({ uri });
}
