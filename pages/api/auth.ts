import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ResponseCookies } from "@edge-runtime/cookies";
import { verifySignature } from "utils/verify";

export const config = {
  runtime: "edge",
};

const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  try {
    const body = await req.json();
    const result = verifySignature(body.signature, body.address);

    if (result === true) {
      const headers = new Headers();
      const responseCookies = new ResponseCookies(headers);
      responseCookies.set("token", body.signature, {
        sameSite: "strict",
        httpOnly: true,
        expires: new Date(Date.now() + MAX_AGE),
      });
      responseCookies.set("currentUser", body.address, {
        sameSite: "strict",
        httpOnly: true,
        expires: new Date(Date.now() + MAX_AGE),
      });
      return new NextResponse(null, { status: 200, headers });
    } else {
      return new NextResponse(null, {
        status: 401,
        statusText: "Unauthorized",
      });
    }
  } catch (err) {
    console.error(err);
    return new NextResponse(null, {
      status: 400,
      statusText: "Bad Request",
    });
  }
}
