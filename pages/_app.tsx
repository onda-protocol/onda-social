import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useMemo } from "react";
import { Toaster } from "react-hot-toast";
import "@solana/wallet-adapter-react-ui/styles.css";

import theme from "../theme";
import { Navbar } from "components/layout/navbar";
import { DocumentHead } from "components/document";
import { AwardModalProvider } from "components/modal";
import { MagicProvider } from "components/providers/magic";
import { AuthProvider } from "components/providers/auth";

export default function App({ Component, pageProps }: AppProps) {
  const wallets = useMemo(() => [], []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log(
              "Service Worker registration successful with scope: ",
              registration.scope
            );
          },
          (err) => {
            console.log("Service Worker registration failed: ", err);
          }
        );
      });
    }
  }, []);

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
          queries: {
            networkMode: "offlineFirst",
            refetchOnWindowFocus: false,
            retry: true,
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <ChakraProvider theme={theme}>
          <ConnectionProvider
            endpoint={process.env.NEXT_PUBLIC_RPC_ENDPOINT as string}
            config={connectionConfig}
          >
            <WalletProvider wallets={wallets}>
              <MagicProvider>
                <AuthProvider>
                  <DocumentHead
                    title="Onda | Find your community"
                    description="Decentralized, community moderated forums. Powered by Solana."
                    url={``}
                  />
                  <Navbar />
                  <AwardModalProvider>
                    <Component {...pageProps} />
                  </AwardModalProvider>
                  <Toaster />
                </AuthProvider>
              </MagicProvider>
            </WalletProvider>
          </ConnectionProvider>
        </ChakraProvider>
      </Hydrate>
      {process.env.NODE_ENV !== "production" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
