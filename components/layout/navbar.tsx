import NextLink from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { IoChevronDown, IoPerson, IoWallet } from "react-icons/io5";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  forwardRef,
  Text,
  MenuGroup,
  MenuDivider,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchUser } from "lib/api";
import { shortenAddress } from "utils/format";
import { AuthStatus, useAuth } from "components/providers/auth";
import { Notifications } from "./notifications";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY;
      if (scrollY > 16) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

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
        backgroundColor="onda.1000"
        borderBottomWidth="1px"
        borderColor={scrolled ? "gray.800" : "onda.1000"}
        boxShadow={scrolled ? "md" : "none"}
        zIndex="docked"
      >
        <Box
          as="nav"
          display="flex"
          h="16"
          w="100%"
          px="4"
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
            <UserMenu />
          </Flex>
        </Box>
      </Box>
    </>
  );
}

const UserMenu = () => {
  const auth = useAuth();
  const userQuery = useQuery(
    ["user", auth.address],
    () => fetchUser(auth.address!),
    {
      enabled: Boolean(auth.address),
    }
  );

  const displayAddress = useMemo(() => {
    if (auth.address) {
      return shortenAddress(auth.address);
    }
  }, [auth.address]);

  async function handleCopyAddress() {
    if (!auth.address) return;

    try {
      await navigator.clipboard.writeText(auth.address);
      toast.success("Copied address to clipboard");
    } catch (err) {
      console.error(err);
    }
  }

  switch (auth.status) {
    case AuthStatus.AUTHENTICATED: {
      return (
        <>
          <Box pr="2">
            <Notifications />
          </Box>
          <Menu size="xl">
            <MenuButton
              as={UserMenuButton}
              name={userQuery.data?.name ?? undefined}
              image={userQuery.data?.avatar ?? undefined}
              address={displayAddress}
            />
            <MenuList>
              <MenuGroup title="User Menu">
                <MenuItem
                  icon={<IoPerson />}
                  as={NextLink}
                  href={`/u/${auth.address}`}
                >
                  Profile
                </MenuItem>
                <MenuItem icon={<IoWallet />} onClick={handleCopyAddress}>
                  Wallet
                </MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuItem onClick={auth.signOut}>Sign Out</MenuItem>
            </MenuList>
          </Menu>
        </>
      );
    }

    default: {
      return (
        <Button
          size="sm"
          onClick={auth.showUI}
          disabled={auth.status === AuthStatus.RESOLVING}
          isLoading={auth.status === AuthStatus.AUTHENTICATING}
        >
          Login
        </Button>
      );
    }
  }
};

interface UserMenuButtonProps {
  address: string;
  name?: string;
  image?: string;
}

export const UserMenuButton = forwardRef<UserMenuButtonProps, "button">(
  ({ name, image, address, ...other }, ref) => {
    return (
      <Box
        ref={ref}
        as="button"
        borderRadius="xl"
        border="1px solid transparent"
        px="3"
        py="1"
        transition="all 0.2s"
        _hover={{
          borderColor: "gray.700",
        }}
        {...other}
      >
        <Flex align="center" gap="2">
          <Avatar size="sm" name={name ?? "anon"} src={image} />
          <Flex flexDirection="column">
            {name ? (
              <>
                <Text fontSize="sm" fontWeight="bold">
                  {name}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.500">
                  {address}
                </Text>
              </>
            ) : (
              <Text fontSize="sm" fontWeight="bold">
                {address}
              </Text>
            )}
          </Flex>
          <Flex color="whiteAlpha.500">
            <IoChevronDown />
          </Flex>
        </Flex>
      </Box>
    );
  }
);
