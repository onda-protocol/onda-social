import type { NextApiRequest, NextApiResponse } from "next";
import { web3 } from "@project-serum/anchor";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mintToCollectionV1 } from "@metaplex-foundation/mpl-bubblegum";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const address = req.query.address as string;

  const umi = createUmi(process.env.HELIUS_RPC_URL as string);
  const secretKey = Uint8Array.from(JSON.parse(process.env.SIGNER as string));
  const wallet = web3.Keypair.fromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, {
    publicKey: publicKey(wallet.publicKey.toBase58()),
    secretKey: wallet.secretKey,
  });
  umi.use(signerIdentity(signer));

  const leafOwner = publicKey(address);
  const merkleTree = publicKey("H6mM8cKnQJuhACm2ZQxn51KwZ9CYCyJWUumQgYm6bpeS");
  const collectionMint = publicKey(
    "FEo7dZpRGAGgjLZ5ihcQ3PbE1pamZajzCsXKvq1f5v7v"
  );

  try {
    await mintToCollectionV1(umi, {
      leafOwner,
      merkleTree,
      collectionMint,
      metadata: {
        name: "Plankton",
        uri: "https://v5ldmr7craj32u3u4gbguhrkipffglrqm7kwcbcpdkb7dpwx6c3q.arweave.net/r1Y2R-KIE71TdOGCah4qQ8pTLjBn1WEETxqD8b7X8Lc",
        sellerFeeBasisPoints: 0,
        collection: { key: collectionMint, verified: false },
        creators: [
          { address: umi.identity.publicKey, verified: true, share: 100 },
        ],
      },
    }).sendAndConfirm(umi);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ ok: false });
  }

  res.json({ ok: true });
}
