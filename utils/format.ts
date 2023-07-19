import { PostType } from "@prisma/client";

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

export function trimNullChars(data: string) {
  return data.replace(/\0.*$/g, "");
}

export function getPrismaPostType(
  postType: "textPost" | "imagePost" | "linkPost"
) {
  switch (postType) {
    case "textPost":
    default:
      return PostType.TEXT;
    case "imagePost":
      return PostType.IMAGE;
    // case "linkPost":
    //   return PostType.LINK;
  }
}
