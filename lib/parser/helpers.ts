import { snakeCase } from "snake-case";
import { sha256 } from "js-sha256";
import base58 from "bs58";

export function genIxIdentifier(ixName: string) {
  const namespace = "global";
  const name = snakeCase(ixName);
  const preimage = `${namespace}:${name}`;
  return base58.encode(sha256.digest(preimage).slice(0, 8));
}
