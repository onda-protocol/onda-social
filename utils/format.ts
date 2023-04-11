export function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function parseBigInt(data: any, fallback: any = []) {
  return JSON.parse(
    JSON.stringify(data ?? fallback, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );
}
