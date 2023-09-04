import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client/edge";

import { parseBigInt } from "utils/format";
import { queryPosts } from "./index";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const namespace = url.pathname.split("/")[3] as string;
  const searchParams = req.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const results = await queryPosts(
    Prisma.sql`WHERE "Forum"."namespace" = ${namespace}`,
    offset
  );

  return NextResponse.json(parseBigInt(results));
}
