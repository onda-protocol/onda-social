import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import prisma from "lib/prisma";
import { parseBigInt } from "utils/format";
import { getCurrentUser } from "utils/verify";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") ?? "0");

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

  const result = await prisma.post
    .findMany({
      where: {
        author: address,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        Author: true,
        Forum: true,
        Votes: votes,
        _count: {
          select: {
            Comments: true,
          },
        },
      },
      take: 20,
      skip: offset,
    })
    .then((posts) =>
      posts.map((post) => ({
        ...post,
        _vote: post.Votes?.[0]?.vote ?? null,
      }))
    );

  const parsedResult = parseBigInt(result);

  return NextResponse.json(parsedResult);
}
