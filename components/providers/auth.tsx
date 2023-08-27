import { createContext, useMemo, useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMagic } from "./magic";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

type Provider = null | "magic" | "wallet";

interface AuthContext {
  address?: string;
  isConnected: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  address: undefined,
  isConnected: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const wallet = useWallet();
  const magic = useMagic()!;
  const router = useRouter();

  const [isConnected, setConnected] = useState(false);
  const [provider, setProvider] = useState<Provider>(null);

  const queryClient = useQueryClient();
  const userInfoQuery = useQuery(["user-info"], () => magic.user.getInfo(), {
    enabled: isConnected && provider === "magic",
  });

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
    }),
    [provider, wallet, isConnected, magic, userInfoQuery.data, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
