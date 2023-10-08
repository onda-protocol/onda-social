import { web3 } from "@project-serum/anchor";
import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";
import base58 from "bs58";

export async function fetchAllAccounts(
  connection: web3.Connection,
  publicKeys: web3.PublicKey[]
) {
  const accountToFetch = [...publicKeys];
  const accountInfos: web3.AccountInfo<Buffer>[] = [];

  while (accountToFetch.length > 0) {
    const limit = Math.min(100, accountToFetch.length);
    const result = await connection.getMultipleAccountsInfo(
      accountToFetch.splice(0, limit)
    );
    accountInfos.push(
      ...result.filter(
        (account): account is NonNullable<web3.AccountInfo<Buffer>> =>
          account !== null
      )
    );
  }

  return accountInfos;
}

export function genIxIdentifier(ixName: string) {
  const namespace = "global";
  const name = snakeCase(ixName);
  const preimage = `${namespace}:${name}`;
  return base58.encode(sha256.digest(preimage).slice(0, 8));
}
