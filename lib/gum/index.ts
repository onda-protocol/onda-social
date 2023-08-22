import type { SessionWalletInterface } from "@gumhq/react-sdk";
import { web3 } from "@project-serum/anchor";
import { COMPRESSION_PROGRAM_ID } from "lib/anchor/constants";

export async function getOrCreateSession(
  session: SessionWalletInterface,
  programId: web3.PublicKey = COMPRESSION_PROGRAM_ID
) {
  let sessionToken = session.sessionToken;
  console.log("session", session);

  if (!sessionToken) {
    let newSession = await session.createSession(programId, true, 60 * 23);

    if (newSession) {
      session = newSession;
    } else {
      throw new Error("Failed to create session");
    }
  }

  return session;
}
