import type { NextApiRequest, NextApiResponse } from "next";
import { Rule } from "@prisma/client/edge";
import { web3 } from "@project-serum/anchor";
import { AccountLayout } from "@solana/spl-token";

import prisma from "lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const namespace = params.namespace as string;
  const owner = params.owner as string;

  const result = await prisma.forum.findUnique({
    where: {
      namespace,
    },
    include: {
      Gates: true,
    },
  });

  if (!result) {
    return res.status(400).send("Forum not found");
  }

  for (let gate of result.Gates) {
    switch (gate.ruleType) {
      case Rule.Token: {
        const result = await searchToken(owner, gate.address[0], gate.amount);
        return res.json(result);
      }

      case Rule.NFT: {
        const result = await searchCollection(owner, gate.address[0]);
        return res.json(result);
      }

      default: {
        continue;
      }
    }
  }

  return res.status(404).send("Forum pass not found");
}

async function searchCollection(owner: string, collection: string) {
  const response = await fetch(process.env.HELIUS_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "onda",
      method: "searchAssets",
      params: {
        ownerAddress: owner,
        compressed: false,
        grouping: ["collection", collection],
        page: 1,
        limit: 10,
      },
    }),
  });
  const { result } = await response.json();
  console.log("Collection assets: ", result);
  return result;
}

async function searchToken(owner: string, mint: string, amount: bigint) {
  const connection = new web3.Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
  const ownerAddress = new web3.PublicKey(owner);
  const mintAddress = new web3.PublicKey(mint);

  try {
    const accounts = await connection.getTokenAccountsByOwner(ownerAddress, {
      mint: mintAddress,
    });
    console.log("Token accounts: ", accounts);

    if (accounts.value.length === 0) {
      return null;
    }

    const pass = accounts.value.find((account) => {
      const decoded = AccountLayout.decode(account.account.data);
      return decoded.amount >= amount;
    });

    if (!pass) {
      return null;
    }

    return {
      mint,
      tokenAccount: pass.pubkey.toBase58(),
      metadata: null,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
}
