import { web3 } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useMemo,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

import { LoginModal } from "components/modal/login";
import { useMagic } from "./magic";

type Provider = null | "magic" | "wallet";

export enum AuthStatus {
  IDLE = "IDLE",
  RESOLVING = "RESOLVING",
  CONNECTED = "CONNECTED",
  AUTHENTICATING = "AUTHENTICATING",
  AUTHENTICATED = "AUTHENTICATED",
  ERROR = "ERROR",
}

const AUTH_MESSAGE = process.env.NEXT_PUBLIC_AUTH_MESSAGE!;

interface AuthContext {
  status: AuthStatus;
  address?: string;
  showUI: () => void;
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction:
    | ((transaction: web3.Transaction) => Promise<web3.Transaction>)
    | null;
}

const AuthContext = createContext<AuthContext>({
  status: AuthStatus.IDLE,
  address: undefined,
  showUI: () => {},
  signOut: async () => {},
  signIn: async () => {},
  signMessage: async () => "",
  signTransaction: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const wallet = useWallet();
  const magic = useMagic()!;
  const router = useRouter();

  const [loginModal, setLoginModal] = useState(false);
  const [provider, setProvider] = useState<Provider>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);

  const isAuthenticated = authStatus === AuthStatus.AUTHENTICATED;
  const isResolvingRef = useRef(false);

  const queryClient = useQueryClient();
  const userInfoQuery = useQuery(["user-info"], () => magic.user.getInfo(), {
    enabled: isAuthenticated && provider === "magic",
  });

  useEffect(() => {
    if (isAuthenticated) {
      setLoginModal(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (
      router.isReady &&
      !router.pathname.includes("/oauth/callback") &&
      magic?.user &&
      authStatus === AuthStatus.IDLE &&
      isResolvingRef.current === false
    ) {
      isResolvingRef.current = true;
      setAuthStatus(AuthStatus.RESOLVING);

      magic.user.isLoggedIn().then(async (isLoggedIn) => {
        if (isLoggedIn) {
          setAuthStatus(AuthStatus.AUTHENTICATING);
          setProvider("magic");

          const userInfo = await queryClient.fetchQuery(["user-info"], () =>
            magic.user.getInfo()
          );
          const address = userInfo.publicAddress;

          if (!address) {
            isResolvingRef.current = false;
            setAuthStatus(AuthStatus.ERROR);
            setProvider(null);
            console.error("Failed to get publicAddress");
            toast.error("Failed to sign in");
            return;
          }

          magic.solana
            .signMessage(new TextEncoder().encode(AUTH_MESSAGE))
            .then((signature) => {
              // Set cookie
              return authenticate(address, signature).then(({ message }) => {
                setAuthStatus(AuthStatus.AUTHENTICATED);
                toast.success("Signed in");
                if (message === "SHOULD_INVALIDATE") {
                  queryClient.invalidateQueries(["posts"]);
                }
              });
            })
            .catch((err) => {
              setAuthStatus(AuthStatus.ERROR);
              toast.error("Failed to sign in");
              console.error("Failed to authenticate");
              console.error(err);
            })
            .finally(() => {
              isResolvingRef.current = false;
            });
        }
      });
    }
  }, [magic, queryClient, router, authStatus]);

  const signIn = useCallback(async () => {
    if (
      provider === "wallet" &&
      wallet.publicKey &&
      wallet.connected &&
      wallet.signMessage
    ) {
      setAuthStatus(AuthStatus.AUTHENTICATING);

      try {
        const signature = await wallet.signMessage(
          new TextEncoder().encode(AUTH_MESSAGE)
        );
        authenticate(wallet.publicKey.toBase58(), signature)
          .then(({ message }) => {
            setAuthStatus(AuthStatus.AUTHENTICATED);
            toast.success("Signed in");
            if (message === "SHOULD_INVALIDATE") {
              queryClient.invalidateQueries(["posts"]);
            }
          })
          .catch((err) => {
            setAuthStatus(AuthStatus.CONNECTED);
            console.error("Failed to authenticate");
            console.error(err);
            toast.error(
              err instanceof Error ? err.message : "Failed to authenticate"
            );
          });
      } catch (err) {
        setAuthStatus(AuthStatus.CONNECTED);
        console.log("Failed to sign message");
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Failed to sign message"
        );
      }
    } else {
      setAuthStatus(AuthStatus.CONNECTED);
      console.error("Wallet does not support signMessage");
    }
  }, [provider, wallet, queryClient]);

  useEffect(() => {
    if (wallet.connected) {
      debugger;
      setAuthStatus(AuthStatus.CONNECTED);
      setProvider("wallet");
    }
  }, [wallet, signIn]);

  const value = useMemo(
    () => ({
      signIn,
      status: authStatus,
      address:
        provider === "magic"
          ? userInfoQuery.data?.publicAddress ?? undefined
          : wallet.publicKey?.toBase58(),
      showUI: () => setLoginModal(true),
      signOut: async () => {
        await clearCookies();

        if (provider === "magic") {
          await magic.user
            .logout()
            .then(() => {
              setAuthStatus(AuthStatus.IDLE);
              setProvider(null);
              toast.success("Logged out");
              queryClient.setQueryData(["user-info"], undefined);
            })
            .catch((err) => {
              console.error("Failed to signOut");
              console.error(err);
            });
        } else if (provider === "wallet") {
          await wallet
            .disconnect()
            .then(() => {
              setAuthStatus(AuthStatus.IDLE);
              setProvider(null);
              toast.success("Logged out");
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
              })
              .then((signedTransaction) => {
                return web3.Transaction.from(signedTransaction.rawTransaction);
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
    [
      authStatus,
      provider,
      userInfoQuery.data?.publicAddress,
      wallet,
      magic,
      queryClient,
      signIn,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      <>
        {children}
        <LoginModal
          open={loginModal}
          onRequestClose={() => setLoginModal(false)}
        />
      </>
    </AuthContext.Provider>
  );
};

function authenticate(address: string, signature: Uint8Array) {
  return import("bs58").then((base58) => {
    return fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        signature: base58.encode(signature),
      }),
    }).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error("Failed to authenticate");
      }
    });
  });
}

function clearCookies() {
  return fetch("/api/auth/clear").catch(console.error);
}

export const useAuth = (): AuthContext => {
  return useContext(AuthContext);
};
