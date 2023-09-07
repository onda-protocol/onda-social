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
