import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseBigInt } from "utils/format";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const params = new URL(req.url).searchParams;
  const leafOwner = params.get("address")!;

  const response = await fetch(process.env.HELIUS_RPC_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "string",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: leafOwner,
        page: 1,
        limit: 100,
        sortBy: {
          sortBy: "created",
          sortDirection: "asc",
        },
      },
    }),
  });
  const result = await response.json();

  return NextResponse.json(parseBigInt(result));
}
