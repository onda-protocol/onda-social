import { createContext, useMemo, useContext } from "react";
import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth";
import { SolanaExtension } from "@magic-ext/solana";

interface MagicProviderProps {
  children: React.ReactNode;
}

const MagicContext = createContext<Magic<
  (OAuthExtension | SolanaExtension)[]
> | null>(null);

export const MagicProvider = ({ children }: MagicProviderProps) => {
  const magic = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBKEY!, {
      extensions: [
        new OAuthExtension(),
        new SolanaExtension({
          rpcUrl: process.env.NEXT_PUBLIC_RPC_ENDPOINT!,
        }),
      ],
    });
  }, []);

  return (
    <MagicContext.Provider value={magic}>{children}</MagicContext.Provider>
  );
};

export const useMagic = () => {
  return useContext(MagicContext);
};
