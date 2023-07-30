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
  const parent = params.get("parent");
  const skip = parseInt(params.get("skip") ?? "0");

  const result = await prisma.comment.findMany({
    skip,
    where: {
      post: address as string,
      parent: parent as string,
    },
    orderBy: {
      likes: "desc",
    },
    include: {
      Author: true,
      Children: {
        take: 10,
        orderBy: {
          likes: "desc",
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
