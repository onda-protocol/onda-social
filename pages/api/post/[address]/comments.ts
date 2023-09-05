import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const parent = searchParams.get("parent");
  const limit = parseInt(searchParams.get("limit") ?? "100");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const result = await prisma.comment.findMany({
    where: {
      parent,
      post: address as string,
    },
    orderBy: {
      points: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      Author: true,
      Children: {
        take: 3,
        orderBy: {
          points: "desc",
        },
        include: {
          Author: true,
          Children: {
            take: 3,
            orderBy: {
              points: "desc",
            },
            include: {
              Author: true,
              Children: {
                take: 3,
                orderBy: {
                  points: "desc",
                },
              },
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
