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
  const parent = searchParams.get("parent");
  const skip = parseInt(searchParams.get("skip") ?? "0");

  const result = await prisma.comment.findMany({
    skip,
    where: {
      post: address as string,
      parent: parent as string,
    },
    orderBy: {
      points: "desc",
    },
    include: {
      Author: true,
      Children: {
        take: 10,
        orderBy: {
          points: "desc",
        },
        include: {
          Author: true,
          _count: {
            select: {
              Children: true,
            },
          },
        },
      },
      _count: {
        select: {
          Children: true,
        },
      },
    },
  });

  return NextResponse.json(parseBigInt(result));
}
