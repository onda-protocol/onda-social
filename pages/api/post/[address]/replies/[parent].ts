import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import prisma from "lib/prisma";
import { parseBigInt } from "utils/format";
import { getCurrentUser } from "utils/verify";
import { mapNestedComment } from "../comments";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const parent = searchParams.get("parent");
  const skip = parseInt(searchParams.get("skip") ?? "0");

  const currentUser = await getCurrentUser(req);
  const votes = currentUser
    ? {
        where: {
          user: currentUser,
        },
        select: {
          vote: true,
        },
      }
    : false;

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
      Votes: votes,
      Children: {
        take: 10,
        orderBy: {
          points: "desc",
        },
        include: {
          Author: true,
          Votes: votes,
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

  const parsedResults = parseBigInt(result);
  const replies = parsedResults.map(mapNestedComment);

  return NextResponse.json(replies);
}
