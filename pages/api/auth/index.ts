import { NextResponse, NextFetchEvent, NextRequest } from "next/server";
import { RequestCookies, ResponseCookies } from "@edge-runtime/cookies";
import { verifySignature } from "utils/verify";

export const config = {
  runtime: "edge",
};

const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  let shouldInvalidate = true;

  const cookies = new RequestCookies(req.headers);
  const token = cookies.get("token")?.value;
  const currentUser = cookies.get("currentUser")?.value;
  if (token && currentUser) {
    const result = verifySignature(token, currentUser);
    shouldInvalidate = !result;
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
      return NextResponse.json(
        { message: shouldInvalidate ? "SHOULD_INVALIDATE" : "OK" },
        { status: 200, headers }
      );
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
