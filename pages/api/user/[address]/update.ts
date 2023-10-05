import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import prisma from "lib/prisma";
import { getCurrentUser } from "utils/verify";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  if (req.method !== "PUT") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  const url = new URL(req.url);
  const address = url.pathname.split("/")[3] as string;
  const currentUser = await getCurrentUser(req);

  if (currentUser !== address) {
    return new NextResponse(null, { status: 401, statusText: "Unauthorized" });
  }

  const payload = await req.json();

  if (!isValidPayload(payload)) {
    return new NextResponse(null, { status: 400, statusText: "Bad Request" });
  }

  let mint: string | null = null;
  let avatar: string | null = null;

  if (typeof payload.mint === "string") {
    try {
      const result = await getAsset(payload.mint);

      if (result) {
        mint = payload.mint;
        avatar = result.content?.files[0]?.cdn_uri ?? null;
      }
    } catch (err) {
      console.error(err);
    }
  }

  try {
    const user = await prisma.user.upsert({
      where: {
        id: currentUser,
      },
      create: {
        mint,
        avatar,
        id: currentUser,
        name: payload.name,
      },
      update: {
        mint,
        avatar,
        name: payload.name,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return new NextResponse(null, {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
}

interface GetAssetResult {
  id: string;
  content: {
    files: [
      {
        cdn_uri: string;
      }
    ];
  };
  ownership: {
    owner: string;
  };
}

async function getAsset(id: string): Promise<GetAssetResult> {
  const requestId = uuid();
  console.log(`getAsset ${id} - request id: ${requestId}`);
  const response = await fetch(process.env.HELIUS_RPC_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: requestId,
      method: "getAsset",
      params: {
        id,
      },
    }),
  });
  const { result } = await response.json();
  return result;
}

function isValidPayload(payload: any) {
  if (typeof payload !== "object") {
    return false;
  }

  if (typeof payload.name !== "string") {
    return false;
  }

  if (!(payload.name.length > 5 && payload.name.length <= 32)) {
    return false;
  }

  if (typeof payload.mint !== "string" && payload.mint !== null) {
    return false;
  }

  return true;
}
