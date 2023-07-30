import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const params = new URL(req.url).searchParams;
  const address = params.get("address");

  const result = await prisma.post.findMany({
    where: {
      author: address as string | undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      Author: true,
      Forum: true,
      _count: {
        select: {
          Comments: true,
        },
      },
    },
  });

  const parsedResult = parseBigInt(result);
  return NextResponse.json(parsedResult);
}
