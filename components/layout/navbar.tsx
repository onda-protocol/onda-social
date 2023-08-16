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
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { AccountLayout } from "@solana/spl-token";

export function Navbar() {
  const modal = useWalletModal();
  const wallet = useWallet();

  const displayAddress = useMemo(() => {
    if (wallet.publicKey) {
      const base58 = wallet.publicKey.toBase58();
      return base58.slice(0, 4) + "..." + base58.slice(-4);
    }
  }, [wallet]);

  function onConnect() {
    modal.setVisible(true);
  }

  function UserMenuButton() {
    return (
      <ButtonGroup spacing="0">
        {wallet.publicKey ? (
          <>
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
