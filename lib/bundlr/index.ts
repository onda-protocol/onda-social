import { NodeBundlr } from "@bundlr-network/client";
import { web3 } from "@project-serum/anchor";

const BUNDLR_URL = process.env.NEXT_PUBLIC_BUNDLR_URL as string;

export type ContentType =
  | "application/json"
  | "image/webp"
  | "image/png"
  | "image/jpeg"
  | "image/gif";

export async function upload(
  keypair: web3.Keypair,
  data: string,
  contentType: ContentType
) {
  const bundlr = new NodeBundlr(BUNDLR_URL, "solana", keypair.secretKey, {
    providerUrl: process.env.HELIUS_RPC_URL!,
  });
  await bundlr.ready();

  const byteLength = Buffer.from(data, "utf-8").byteLength;
  const lamports = await bundlr.getPrice(byteLength);
  await bundlr.fund(lamports);

  const result = await bundlr.upload(data, {
    tags: [{ name: "Content-Type", value: contentType }],
  });
  `Data uploaded ==> https://arweave.net/${result.id}`;
  return `https://arweave.net/${result.id}`;
}
