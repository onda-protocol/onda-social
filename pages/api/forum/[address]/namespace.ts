import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const params = new URL(req.url).searchParams;
  const namespace = params.get("address")!;
  const result = await prisma.forum.findUnique({
    where: {
      namespace,
    },
    include: {
      Gates: true,
    },
  });

  return NextResponse.json(parseBigInt(result));
}
