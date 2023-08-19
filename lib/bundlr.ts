import type { SessionWalletInterface } from "@gumhq/react-sdk";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { WebBundlr } from "@bundlr-network/client";

const BUNDLR_URL = process.env.NEXT_PUBLIC_BUNDLR_URL as string;

async function getBundlr(
  wallet: WalletContextState,
  session: SessionWalletInterface | null,
  data: string | Buffer
) {
  const byteLength = Buffer.isBuffer(data)
    ? data.byteLength
    : Buffer.from(data, "utf-8").byteLength;
  const isFreeUpload = byteLength < 100000;

  const bundlr = new WebBundlr(
    BUNDLR_URL,
    "solana",
    isFreeUpload && session ? session : wallet
  );
  await bundlr.ready();
  return bundlr;
}

export type ContentType =
  | "application/json"
  | "image/webp"
  | "image/png"
  | "image/jpeg"
  | "image/gif";

export async function upload(
  wallet: WalletContextState,
  session: SessionWalletInterface | null,
  data: string | Buffer,
  contentType: ContentType
) {
  const bundlr = await getBundlr(wallet, session, data);
  const result = await bundlr.upload(data, {
    tags: [{ name: "Content-Type", value: contentType }],
  });
  `Data uploaded ==> https://arweave.net/${result.id}`;
  return `https://arweave.net/${result.id}`;
}
