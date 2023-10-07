import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(_req: NextRequest, _ctx: NextFetchEvent) {
  const result = await prisma.award.findMany({
    where: {
      public: true,
    },
    orderBy: {
      amount: "desc",
    },
    include: {
      Matching: true,
    },
  });
  return NextResponse.json(parseBigInt(result));
}
