import { web3 } from "@project-serum/anchor";

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
