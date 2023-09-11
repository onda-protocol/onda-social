import { NextRequest } from "next/server";
import { RequestCookies } from "@edge-runtime/cookies";
import base58 from "bs58";
import nacl from "tweetnacl";

const AUTH_MESSAGE = process.env.NEXT_PUBLIC_AUTH_MESSAGE!;

export function verifySignature(signature: string, publicKey: string) {
  return nacl.sign.detached.verify(
    new TextEncoder().encode(AUTH_MESSAGE),
    base58.decode(signature),
    base58.decode(publicKey)
  );
}

export function getCurrentUser(req: NextRequest) {
  const cookies = new RequestCookies(req.headers);
  const token = cookies.get("token")?.value;
  const currentUser = cookies.get("currentUser")?.value;

  if (token && currentUser) {
    const verified = verifySignature(token, currentUser);
    return verified === true ? currentUser : null;
  }
  return null;
}
