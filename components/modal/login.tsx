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
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletConnectionError } from "@solana/wallet-adapter-base";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

import { useMagic } from "components/providers/magic";
import Image from "next/image";
import { useEffect } from "react";

interface LoginModalProps {}

export const LoginModal = ({}: LoginModalProps) => {
  const magic = useMagic()!;
  const wallet = useWallet();

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

  console.log("wallet context: ", wallet);

  return (
    <Modal size="lg" isOpen={true} onClose={() => {}}>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent backgroundColor="onda.950">
        <ModalBody padding="8">
          <Box display="flex" justifyContent="center">
            <Image src="/onda.svg" height={10} width={50} alt="Onda logo" />
          </Box>
          <Heading size="lg" textAlign="center" my="2">
            Welcome to Onda
          </Heading>
          <Text textAlign="center" color="whiteAlpha.800">
            Sign in to continue
          </Text>

          <Box p="8" />

          <Button
            width="100%"
            variant="solid"
            leftIcon={<FcGoogle />}
            isLoading={loginWithGoogle.isLoading}
            onClick={() => loginWithGoogle.mutate()}
          >
            Sign In with Google
          </Button>

          <Box position="relative" padding="10">
            <Divider />
            <AbsoluteCenter bg="onda.950" px="4">
              <Text fontSize="sm">OR</Text>
            </AbsoluteCenter>
          </Box>

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
              Sign In with {adapter.adapter.name}
            </Button>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
