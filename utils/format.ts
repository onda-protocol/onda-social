const LAMPORTS_PER_SOL = 1000000000;

export function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function parseBigInt(data: any, fallback: any = []) {
  return JSON.parse(
    JSON.stringify(
      typeof data === "string" ? JSON.parse(data) : data ?? fallback,
      (_, v) => (typeof v === "bigint" ? v.toString() : v)
    )
  );
}

export function trimNullChars(data: string) {
  return data.replace(/\0.*$/g, "");
}

const amountCache = new Map<string, string>();

export function formatAmount(amount?: string | number): string {
  if (!amount) return "";

  if (amountCache.has(amount.toString())) {
    return amountCache.get(amount.toString()) as string;
  }

  const bigint = BigInt(amount);

  if (bigint === BigInt(0)) {
    return "0.00";
  }

  const sol = Number(amount) / LAMPORTS_PER_SOL;
  const rounded = Math.round((sol + Number.EPSILON) * 10_000) / 10_000;

  let formatted = rounded.toFixed(3).replace(/0{1,2}$/, "");

  amountCache.set(amount.toString(), formatted);

  return formatted;
}
