import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";
import { getCurrentUser } from "../../posts";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;

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

  const result = await prisma.post.findUnique({
    where: {
      id: address as string,
    },
    include: {
      Forum: true,
      Author: true,
      Votes: votes,
      _count: {
        select: {
          Comments: true,
        },
      },
    },
  });

  if (!result) {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  const parsedResult = parseBigInt(result);
  parsedResult._vote = parsedResult.Votes?.[0]?.vote ?? null;

  return NextResponse.json(parsedResult);
}
