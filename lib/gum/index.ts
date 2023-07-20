import { SessionWalletInterface } from "@gumhq/react-sdk";
import { web3 } from "@project-serum/anchor";
import { COMPRESSION_PROGRAM_ID } from "lib/anchor/constants";

export async function getOrCreateSession(
  session: SessionWalletInterface,
  programId: web3.PublicKey = COMPRESSION_PROGRAM_ID
) {
  let sessionToken = await session.getSessionToken();

  if (!sessionToken) {
    const newSession = await session.createSession(
      programId,
      true,
      60,
      ({ sessionToken, publicKey }) => {
        console.log("Session created: ", sessionToken, publicKey);
      }
    );

    if (newSession) {
      session = newSession;
      console.log("Session created:", session);
    } else {
      console.error("Failed to create session");
    }
  }

  return session;
}
