import { NodeBundlr, WebBundlr } from "@bundlr-network/client";
import { web3 } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";

const BUNDLR_URL = process.env.NEXT_PUBLIC_BUNDLR_URL!;

export type ContentType =
  | "application/json"
  | "image/webp"
  | "image/png"
  | "image/jpeg"
  | "image/gif";

export async function nodeUpload(
  keypair: web3.Keypair,
  data: string | Buffer,
  contentType: ContentType
) {
  const bundlr = new NodeBundlr(BUNDLR_URL, "solana", keypair.secretKey, {
    providerUrl: process.env.HELIUS_RPC_URL!,
  });
  await bundlr.ready();

  const byteLength =
    typeof data === "string"
      ? Buffer.from(data, "utf-8").byteLength
      : data.byteLength;
  const lamports = await bundlr.getPrice(byteLength);
  await bundlr.fund(lamports);

  const result = await bundlr.upload(data, {
    tags: [{ name: "Content-Type", value: contentType }],
  });
  `Data uploaded ==> https://arweave.net/${result.id}`;
  return `https://arweave.net/${result.id}`;
}

export async function webUpload(
  wallet: WalletContextState,
  data: string | Buffer,
  contentType: ContentType
) {
  const bundlr = new WebBundlr(BUNDLR_URL, "solana", wallet, {
    providerUrl: process.env.NEXT_PUBLIC_RPC_ENDPOINT!,
  });
  await bundlr.ready();

  const byteLength =
    typeof data === "string"
      ? Buffer.from(data, "utf-8").byteLength
      : data.byteLength;
  const lamports = await bundlr.getPrice(byteLength);
  await bundlr.fund(lamports);

  const result = await bundlr.upload(data, {
    tags: [{ name: "Content-Type", value: contentType }],
  });
  `Data uploaded ==> https://arweave.net/${result.id}`;
  return `https://arweave.net/${result.id}`;
}
