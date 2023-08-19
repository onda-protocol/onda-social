import { PostType } from "@prisma/client";

export function shortenAddress(address: string) {
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
