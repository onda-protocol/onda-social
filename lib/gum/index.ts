import { SessionWalletInterface } from "@gumhq/react-sdk";
import { COMPRESSION_PROGRAM_ID } from "lib/anchor/constants";

export async function getOrCreateSession(session: SessionWalletInterface) {
  let sessionToken = await session.getSessionToken();

  if (!sessionToken) {
    const newSession = await session.createSession(
      COMPRESSION_PROGRAM_ID,
      true,
      24 * 60,
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
