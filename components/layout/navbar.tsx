import NextLink from "next/link";
import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";
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

import { AuthStatus, useAuth } from "components/providers/auth";

export function Navbar() {
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
            </Box>

            <Flex align="center">
              <AuthMenu />
            </Flex>
          </Box>
        </Container>
      </Box>
    </>
  );
}

const AuthMenu = () => {
  const auth = useAuth();

  const displayAddress = useMemo(() => {
    if (auth.address) {
      return auth.address.slice(0, 4) + "..." + auth.address.slice(-4);
    }
  }, [auth.address]);

  switch (auth.status) {
    case AuthStatus.AUTHENTICATED: {
      return (
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
            <MenuItem fontSize="sm" onClick={auth.logout}>
              Disconnect
            </MenuItem>
          </MenuList>
        </Menu>
      );
    }

    default: {
      return (
        <Button size="sm" onClick={auth.showUI}>
          Login
        </Button>
      );
    }
  }
};
