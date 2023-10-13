import type { NextFetchEvent, NextRequest } from "next/server";
import type { Prisma } from "@prisma/client/edge";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get("id");
  const name = searchParams.get("name");

  const where: Prisma.UserWhereInput = {};

  if (address) {
    where.id = address;
  }

  if (name) {
    where.name = name;
  }

  const result = await prisma.user.findFirst({
    where,
  });

  return NextResponse.json(result);
}
