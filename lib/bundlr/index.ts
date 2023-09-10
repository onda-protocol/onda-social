import { NodeBundlr, WebBundlr } from "@bundlr-network/client";
import Bundlr from "@bundlr-network/client/build/cjs/common/bundlr";
import { web3 } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";

const BUNDLR_URL = process.env.NEXT_PUBLIC_BUNDLR_URL!;
const MAX_BYTE_LENGTH = 10000000;

export type ContentType =
  | "application/json"
  | "image/webp"
  | "image/png"
  | "image/jpeg"
  | "image/gif";

let nodeBundlr: Bundlr | null = null;

export async function nodeUpload(
  keypair: web3.Keypair,
  data: string | Buffer,
  contentType: ContentType
) {
  if (nodeBundlr === null) {
    nodeBundlr = new NodeBundlr(BUNDLR_URL, "solana", keypair.secretKey, {
      providerUrl: process.env.HELIUS_RPC_URL!,
    });
    await nodeBundlr.ready();
  }

  const byteLength =
    typeof data === "string"
      ? Buffer.from(data, "utf-8").byteLength
      : data.byteLength;

  if (byteLength > MAX_BYTE_LENGTH) {
    throw new Error("Data too large");
  }

  // const lamports = await bundlr.getPrice(byteLength);
  // await bundlr.fund(lamports);
  const result = await nodeBundlr.upload(data, {
    tags: [{ name: "Content-Type", value: contentType }],
  });

  console.log(`Data uploaded ==> https://arweave.net/${result.id}`);
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
