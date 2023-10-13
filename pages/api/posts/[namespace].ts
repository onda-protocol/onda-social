import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client/edge";

import { parseBigInt } from "utils/format";
import { getCurrentUser } from "utils/verify";
import { queryPosts } from "./index";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const namespace = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const currentUser = await getCurrentUser(req);

  const results = await queryPosts(
    currentUser ? Prisma.sql`"PostVote".vote AS "Vote.vote",` : Prisma.empty,
    Prisma.sql`
      ${
        currentUser
          ? Prisma.sql`LEFT JOIN "PostVote" ON "Post"."id" = "PostVote"."post" AND "PostVote"."user" = ${currentUser}`
          : Prisma.empty
      }
      WHERE "Forum"."namespace" = ${namespace}
    `,
    offset
  );

  return NextResponse.json(parseBigInt(results));
}
