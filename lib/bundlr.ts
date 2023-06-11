import { WebBundlr } from "@bundlr-network/client";
import { WalletContextState } from "@solana/wallet-adapter-react";

const BUNDLR_URL = process.env.NEXT_PUBLIC_BUNDLR_URL as string;

let bundlr: WebBundlr;

async function getBundlr(wallet: WalletContextState) {
  if (!bundlr) {
    bundlr = new WebBundlr(BUNDLR_URL, "solana", wallet);
    await bundlr.ready();
  }
  console.log("bundlr", bundlr);
  return bundlr;
}

export async function upload(
  wallet: WalletContextState,
  data: string | Buffer
) {
  const bundlr = await getBundlr(wallet);
  const result = await bundlr.upload(data);
  console.log(`Data uploaded ==> https://arweave.net/${result.id}`);
  return `https://arweave.net/${result.id}`;
}
