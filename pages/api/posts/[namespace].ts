import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client/edge";

import { parseBigInt } from "utils/format";
import { queryPosts } from "./index";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const params = new URL(req.url).searchParams;
  const namespace = params.get("namespace")!;

  const results = await queryPosts(
    Prisma.sql`WHERE "Forum"."namespace" = ${namespace}`
  );

  return NextResponse.json(parseBigInt(results));
}