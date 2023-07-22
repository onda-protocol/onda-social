import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SessionWalletProvider, useSessionKeyManager } from "@gumhq/react-sdk";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useMemo } from "react";
import { Toaster } from "react-hot-toast";
import "@solana/wallet-adapter-react-ui/styles.css";

import theme from "../theme";
import { Navbar } from "../components/layout/navbar";
import { DocumentHead } from "../components/document";

export default function App({ Component, pageProps }: AppProps) {
  const wallets = useMemo(() => [], []);

  const connectionConfig = useMemo(
    () => ({
      commitment: "confirmed" as const,
      confirmTransactionInitialTimeout: 90_000,
    }),
    []
  );

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: false },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <ConnectionProvider
          endpoint={process.env.NEXT_PUBLIC_RPC_ENDPOINT as string}
          config={connectionConfig}
        >
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <SessionProvider>
                <ChakraProvider theme={theme}>
                  <DocumentHead
                    title="Onda | Find your community"
                    description="Decentralized, community-owned, and community-driven. Discover your web3 tribe today with Onda."
                    url={``}
                  />
                  <Navbar />
                  <Component {...pageProps} />
                  <Toaster />
                </ChakraProvider>
              </SessionProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </Hydrate>
      {process.env.NODE_ENV !== "production" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

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
