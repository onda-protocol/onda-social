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

  const result = await prisma.notification.findMany({
    where: {
      user: address as string,
    },
    include: {
      Claim: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(parseBigInt(result));
}
