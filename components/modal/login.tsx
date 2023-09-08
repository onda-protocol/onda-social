import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Text,
  Box,
  Button,
  Heading,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  Divider,
  AbsoluteCenter,
  Spinner,
} from "@chakra-ui/react";
import Image from "next/image";
import { WalletConnectionError } from "@solana/wallet-adapter-base";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

import { AuthStatus, useAuth } from "components/providers/auth";
import { useMagic } from "components/providers/magic";

interface LoginModalProps {
  open: boolean;
  onRequestClose: () => void;
}

export const LoginModal = ({ open, onRequestClose }: LoginModalProps) => {
  const magic = useMagic()!;
  const wallet = useWallet();
  const auth = useAuth();
  const signInRef = useRef(true);

  const loginWithGoogle = useMutation(
    async () => {
      magic.oauth.loginWithRedirect({
        provider: "google",
        redirectURI: `${process.env.NEXT_PUBLIC_HOST as string}/oauth/callback`,
        scope: ["https://www.googleapis.com/auth/userinfo.email"],
      });
    },
    {
      onError() {
        toast.error("Failed to login with Google");
      },
    }
  );

  useEffect(() => {
    if (open && signInRef.current && auth.status === AuthStatus.CONNECTED) {
      signInRef.current = false;
      auth.signIn();
    }
  }, [auth, open]);

  useEffect(() => {
    async function handleConnect() {
      try {
        await wallet.connect();
      } catch (err) {
        console.log(err);
        toast.error(
          err instanceof WalletConnectionError ? err.message : "Unknown error"
        );
      }
    }

    if (
      !wallet.connected &&
      !wallet.connecting &&
      wallet.wallet?.readyState === "Installed"
    ) {
      handleConnect();
    }
  }, [wallet]);

  function renderBody() {
    switch (auth.status) {
      case AuthStatus.CONNECTED:
      case AuthStatus.AUTHENTICATING: {
        return (
          <>
            <Box display="flex" justifyContent="center">
              <Image src="/onda.svg" height={10} width={50} alt="Onda logo" />
            </Box>
            <Heading size="lg" textAlign="center" my="2">
              Welcome to Onda
            </Heading>
            <Text textAlign="center" color="whiteAlpha.800">
              Please sign the following message to continue
            </Text>

            <Box p="8" />

            <Button
              width="100%"
              variant="solid"
              isLoading={auth.status === AuthStatus.AUTHENTICATING}
              onClick={auth.signIn}
            >
              Sign Message
            </Button>
          </>
        );
      }

      case AuthStatus.AUTHENTICATED: {
        return (
          <>
            <Box display="flex" justifyContent="center">
              <Image src="/onda.svg" height={10} width={50} alt="Onda logo" />
            </Box>
            <Text textAlign="center" color="whiteAlpha.800">
              Please wait...
            </Text>
            <Box p="8" alignItems="center">
              <Spinner />
            </Box>
          </>
        );
      }

      default: {
        return (
          <>
            <Box display="flex" justifyContent="center">
              <Image src="/onda.svg" height={10} width={50} alt="Onda logo" />
            </Box>
            <Heading size="lg" textAlign="center" my="2">
              Welcome to Onda
            </Heading>
            <Text textAlign="center" color="whiteAlpha.800">
              Please Sign In to continue
            </Text>

            <Box p="8" />

            <Button
              width="100%"
              variant="solid"
              leftIcon={<FcGoogle />}
              isLoading={loginWithGoogle.isLoading}
              onClick={() => loginWithGoogle.mutate()}
            >
              Continue with Google
            </Button>

            {wallet.wallets.length ? (
              <Box position="relative" padding="10">
                <Divider />
                <AbsoluteCenter bg="onda.950" px="4">
                  <Text fontSize="sm">OR</Text>
                </AbsoluteCenter>
              </Box>
            ) : null}

            {wallet.wallets.map((adapter) => (
              <Button
                key={adapter.adapter.name}
                width="100%"
                mb="2"
                variant="solid"
                leftIcon={
                  <Box>
                    <Image
                      unoptimized
                      src={adapter.adapter.icon}
                      width={18}
                      height={18}
                      alt={`${adapter.adapter.name} wallet icon`}
                      style={{
                        objectFit: "contain",
                        objectPosition: "center",
                      }}
                    />
                  </Box>
                }
                isLoading={loginWithGoogle.isLoading}
                onClick={() => wallet.select(adapter.adapter.name)}
              >
                Connect with {adapter.adapter.name}
              </Button>
            ))}
          </>
        );
      }
    }
  }

  return (
    <Modal size="lg" isOpen={open} onClose={onRequestClose}>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent backgroundColor="onda.950">
        <ModalBody padding="8">{renderBody()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
