import { Rule, Gate } from "@prisma/client/edge";
import { web3 } from "@project-serum/anchor";
import { AccountLayout } from "@solana/spl-token";

import { findMetadataPda } from "utils/pda";

export async function findPass(gates: Gate[], owner: string) {
  for (let gate of gates) {
    switch (gate.ruleType) {
      case Rule.Token: {
        const result = await searchToken(owner, gate.address[0], gate.amount);

        if (result) {
          return result;
        }
        break;
      }

      case Rule.Nft: {
        const result = await searchCollection(owner, gate.address[0]);

        if (result) {
          return result;
        }
        break;
      }
    }
  }
}

async function searchCollection(owner: string, collection: string) {
  const response = await fetch(process.env.HELIUS_RPC_URL!, {
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

  if (result.items[0]) {
    const mint = result.items[0].id as string;
    const tokenResult = await searchToken(owner, mint, BigInt(1));

    if (tokenResult) {
      const metadata = findMetadataPda(new web3.PublicKey(mint));

      return {
        mint,
        metadata: metadata.toBase58(),
        tokenAccount: tokenResult.tokenAccount,
      };
    }
  }

  return null;
}

async function searchToken(owner: string, mint: string, amount: bigint) {
  const connection = new web3.Connection(process.env.HELIUS_RPC_URL!);
  const ownerAddress = new web3.PublicKey(owner);
  const mintAddress = new web3.PublicKey(mint);

  try {
    const accounts = await connection.getTokenAccountsByOwner(ownerAddress, {
      mint: mintAddress,
    });

    if (accounts.value.length === 0) {
      return null;
    }

    const tokenAccount = accounts.value.find((account) => {
      const decoded = AccountLayout.decode(account.account.data);
      return decoded.amount >= amount;
    });

    if (!tokenAccount) {
      return null;
    }

    return {
      mint,
      tokenAccount: tokenAccount.pubkey.toBase58(),
      metadata: null,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
}
