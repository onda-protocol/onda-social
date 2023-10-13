import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseBigInt } from "utils/format";
import prisma from "lib/prisma";
import { getCurrentUser } from "utils/verify";
import { StatusError } from "utils/error";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;

  if (req.method !== "PUT") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  const currentUser = await getCurrentUser(req);

  if (currentUser === null) {
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  }

  await prisma.notification.updateMany({
    where: {
      user: address as string,
      claimId: null,
    },
    data: {
      read: true,
    },
  });

  return NextResponse.json("Ok");
}
