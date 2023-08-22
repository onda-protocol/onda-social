import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth";
import { SolanaExtension } from "@magic-ext/solana";

export class MagicClient {
  private magic: Magic<(OAuthExtension | SolanaExtension)[]>;

  constructor() {
    this.magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBKEY as string, {
      extensions: [
        new OAuthExtension(),
        new SolanaExtension({
          rpcUrl: process.env.NEXT_PUBLIC_RPC_ENDPOINT as string,
        }),
      ],
    });
  }

  public async getRedirectResult() {
    return this.magic.oauth.getRedirectResult();
  }

  public async getUserInfo() {
    return this.magic.user.getInfo();
  }

  public async getUserWallet() {
    return this.magic.wallet.showUI();
  }

  public async getUserMetadata() {
    return this.magic.user.getMetadata();
  }

  public async isLoggedIn() {
    return this.magic.user.isLoggedIn();
  }

  public async loginWithRedirect() {
    await this.magic.oauth.loginWithRedirect({
      provider: "google",
      redirectURI: `${process.env.NEXT_PUBLIC_HOST as string}/oauth/callback`,
      scope: ["https://www.googleapis.com/auth/userinfo.email"],
    });
  }

  public async signMessage(message: string) {
    return this.magic.solana.signMessage(message);
  }

  public async logout() {
    return this.magic.user.logout();
  }
}
