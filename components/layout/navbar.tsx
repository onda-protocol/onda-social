import NextLink from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { IoWallet } from "react-icons/io5";
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { AccountLayout } from "@solana/spl-token";
import toast from "react-hot-toast";

import { findEscrowTokenPda } from "utils/pda";
import { claimPlankton } from "lib/anchor";

export function Navbar() {
  const modal = useWalletModal();
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet()!;

  const displayAddress = useMemo(() => {
    if (wallet.publicKey) {
      const base58 = wallet.publicKey.toBase58();
      return base58.slice(0, 4) + "..." + base58.slice(-4);
    }
  }, [wallet]);

  const plankQuery = useQuery(
    ["plank", wallet.publicKey?.toBase58()],
    async () => {
      const escrowPda = findEscrowTokenPda(wallet.publicKey!);
      const accountInfo = await connection.getAccountInfo(escrowPda);

      if (accountInfo === null) {
        return null;
      }

      return AccountLayout.decode(accountInfo.data);
    },
    {
      enabled: Boolean(wallet?.publicKey),
    }
  );

  const claimMutation = useMutation(
    async () => {
      return claimPlankton(connection, anchorWallet);
    },
    {
      onSuccess() {
        plankQuery.refetch();
        toast.success("Claimed $PLANK");
      },
      onError(err) {
        // @ts-ignore
        console.log(err?.logs ?? err?.message);
        toast.error("Error claiming $PLANK");
      },
    }
  );

  const formattedPlankBalance = useMemo(() => {
    if (!plankQuery.data || plankQuery.data.amount === BigInt(0)) return 0;

    const amount = Number(Number(plankQuery.data.amount) / 100_000);

    if (amount >= 1000) {
      return Math.round(amount).toLocaleString();
    }

    return amount.toFixed(2);
  }, [plankQuery.data]);

  function onConnect() {
    modal.setVisible(true);
  }

  function UserMenuButton() {
    return (
      <ButtonGroup spacing="0">
        {wallet.publicKey ? (
          <>
            <Button
              size="sm"
              sx={{
                borderRightRadius: 0,
                borderRight: "1px",
                borderColor: "gray.700",
              }}
              disabled={plankQuery.isLoading || claimMutation.isLoading}
              onClick={() =>
                plankQuery.data
                  ? window.open(
                      `https://explorer.solana.com/address/${findEscrowTokenPda(
                        wallet.publicKey!
                      ).toBase58()}`
                    )
                  : claimMutation.mutate()
              }
            >
              <Box as="span">
                {plankQuery.data ? `${formattedPlankBalance}` : "Claim"} $PLANK
              </Box>
            </Button>
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                leftIcon={<Box as={IoWallet} />}
                sx={{
                  borderLeftRadius: 0,
                }}
              >
                {displayAddress}
              </MenuButton>
              <MenuList borderRadius="sm">
                <MenuItem
                  fontSize="sm"
                  onClick={async () => {
                    try {
                      await wallet.disconnect();
                    } catch {
                      // nada
                    }
                  }}
                >
                  Disconnect
                </MenuItem>
              </MenuList>
            </Menu>
          </>
        ) : (
          <Button onClick={onConnect} size="sm">
            Connect Wallet
          </Button>
        )}
      </ButtonGroup>
    );
  }

  return (
    <>
      <Box height="56px" />
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="56px"
        display="flex"
        backgroundColor="onda.900"
        borderBottomWidth="1px"
        borderColor="gray.800"
        zIndex="docked"
      >
        <Container maxW="container.xl">
          <Box
            as="nav"
            display="flex"
            h="16"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" flexDir="row" alignItems="center">
              <Box position="relative" top="2px">
                <NextLink
                  href="/"
                  style={{ display: "inline-block", height: 25 }}
                >
                  <Image
                    priority
                    src="/onda-logo.svg"
                    width={100}
                    height={25}
                    alt="onda logo"
                  />
                </NextLink>
              </Box>
              {/* <Box>
              <PopoverMenu />
            </Box> */}
            </Box>

            <Flex align="center">
              <UserMenuButton />
            </Flex>
          </Box>
        </Container>
      </Box>
    </>
  );
}
