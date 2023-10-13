import type { NextFetchEvent, NextRequest } from "next/server";
import type { DAS } from "helius-sdk";
import { NextResponse } from "next/server";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;

  const awards = await prisma.award.findMany();
  const awardCollectionMints = awards.map((award) => award.collectionMint);

  const response = await fetch(process.env.HELIUS_RPC_URL as string, {
    method: "POST",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "string",
      method: "searchAssets",
      params: {
        ownerAddress: address,
        compressed: true,
        limit: 200,
        sortBy: {
          sortBy: "id",
          sortDirection: "asc",
        },
      },
    }),
  }).then((res) => res.json());

  const items: DAS.GetAssetResponseList["items"] = response.result.items;
  const filtered = items.filter((item) => {
    if (item.grouping?.[0].group_key === "collection") {
      return awardCollectionMints.includes(item.grouping[0].group_value);
    }
    return false;
  });

  return NextResponse.json(filtered);
}
