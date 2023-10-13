import { NextResponse, NextFetchEvent, NextRequest } from "next/server";
import { ResponseCookies } from "@edge-runtime/cookies";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, _ctx: NextFetchEvent) {
  if (req.method !== "GET") {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  const headers = new Headers();
  const responseCookies = new ResponseCookies(headers);
  responseCookies.delete("token");
  responseCookies.delete("currentUser");
  return NextResponse.json({ message: "OK" }, { status: 200, headers });
}
