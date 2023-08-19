import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { SessionWalletProvider, useSessionKeyManager } from "@gumhq/react-sdk";

interface SessionProviderProps {
  children: React.ReactNode;
}

const SessionProvider = ({ children }: SessionProviderProps) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet() as AnchorWallet;
  const cluster = process.env.NEXT_PUBLIC_CLUSTER as "devnet" | "mainnet-beta";
  const sessionWallet = useSessionKeyManager(
    anchorWallet,
    connection,
    cluster ?? "mainnet-beta"
  );

  return (
    <SessionWalletProvider sessionWallet={sessionWallet}>
      {children}
    </SessionWalletProvider>
  );
};

export default SessionProvider;
