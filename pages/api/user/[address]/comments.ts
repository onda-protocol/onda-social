import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get("address");

  const result = await prisma.comment.findMany({
    where: {
      author: address as string,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      Author: true,
      Post: true,
      _count: {
        select: {
          Children: true,
        },
      },
    },
  });

  return NextResponse.json(parseBigInt(result));
}
