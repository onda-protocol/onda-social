import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const page = searchParams.get("page") ?? 1;

  const assets = await fetch(process.env.HELIUS_API_URL as string, {
    method: "POST",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "string",
      method: "getAssetsByOwner",
      params: {
        page,
        ownerAddress: address,
        limit: 100,
        sortBy: {
          sortBy: "created",
          sortDirection: "asc",
        },
      },
    }),
  }).then((res) => res.json());

  return NextResponse.json(assets);
}
