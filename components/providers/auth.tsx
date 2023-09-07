import { web3 } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useMemo, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

import { useMagic } from "./magic";

type Provider = null | "magic" | "wallet";

const AUTH_MESSAGE = process.env.NEXT_PUBLIC_AUTH_MESSAGE!;

interface AuthContext {
  address?: string;
  isConnected: boolean;
  logout: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction:
    | ((transaction: web3.Transaction) => Promise<web3.Transaction>)
    | null;
}

const AuthContext = createContext<AuthContext>({
  address: undefined,
  isConnected: false,
  logout: async () => {},
  signMessage: async () => "",
  signTransaction: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const wallet = useWallet();
  const magic = useMagic()!;
  const router = useRouter();

  const [isConnected, setConnected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(null);

  const queryClient = useQueryClient();
  const userInfoQuery = useQuery(["user-info"], () => magic.user.getInfo(), {
    enabled: isConnected && provider === "magic",
  });

  useEffect(() => {
    const userInfo = userInfoQuery.data;

    if (userInfo && magic.solana) {
      magic.solana
        .signMessage(new TextEncoder().encode(AUTH_MESSAGE))
        .then((signature) => {
          // Set cookie
          import("bs58").then((base58) => {
            return fetch("/api/auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address: userInfo.publicAddress,
                signature: base58.encode(signature),
              }),
            });
          });
        });
    }
  }, [userInfoQuery.data, magic?.solana]);

  useEffect(() => {
    if (
      router.isReady &&
      !router.pathname.includes("/oauth/callback") &&
      magic?.user
    ) {
      magic.user.isLoggedIn().then((isLoggedIn) => {
        if (isLoggedIn) {
          setConnected(isLoggedIn);
          setProvider("magic");
        }
      });
    }
  }, [magic, router]);

  useEffect(() => {
    if (!wallet.connected) return;
    setConnected(true);
    setProvider("wallet");
  }, [wallet]);

  const value = useMemo(
    () => ({
      address:
        provider === "magic"
          ? userInfoQuery.data?.publicAddress ?? undefined
          : wallet.publicKey?.toBase58(),
      isConnected,
      logout: async () => {
        if (provider === "magic") {
          await magic.user
            .logout()
            .then(() => {
              setConnected(false);
              setProvider(null);
              toast.success("Logged out");
            })
            .catch((err) => {
              console.error("Failed to logout");
              console.error(err);
            });
        } else if (provider === "wallet") {
          await wallet
            .disconnect()
            .then(() => {
              toast.success("Disconnected wallet");
              setConnected(false);
              setProvider(null);
              queryClient.setQueryData(["user-info"], undefined);
            })
            .catch((err) => {
              console.error("Failed to disconnect wallet");
              console.error(err);
            });
        }
      },
      async signMessage(message: string) {
        const encodedMessage = new TextEncoder().encode(message);

        switch (provider) {
          case "magic":
            return magic.solana.signMessage(encodedMessage);

          case "wallet": {
            if (wallet.signMessage) {
              return wallet.signMessage(encodedMessage);
            } else {
              // TODO: handle error
            }
          }

          default: {
            // TODO: handle error
          }
        }
      },
      async signTransaction(transaction: web3.Transaction) {
        switch (provider) {
          case "magic":
            return magic.solana
              .signTransaction(transaction, {
                requireAllSignatures: false,
                // verifySignatures: false,
              })
              .then((signedTransaction) => {
                return web3.Transaction.from(signedTransaction.rawTransaction);
              })
              .catch((err) => {
                console.error("Failed to sign transaction");
                console.error(err);
              });

          case "wallet": {
            if (wallet.signTransaction) {
              return wallet.signTransaction(transaction);
            } else {
              throw new Error("Wallet does not support signTransaction");
            }
          }

          default: {
            throw new Error("Wallet does not support signTransaction");
          }
        }
      },
    }),
    [provider, wallet, isConnected, magic, userInfoQuery.data, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContext => {
  return useContext(AuthContext);
};
