import NextLink from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
  IoChevronDown,
  IoLogOut,
  IoPerson,
  IoPersonOutline,
  IoWallet,
} from "react-icons/io5";
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  forwardRef,
  Text,
  MenuItemProps,
  MenuGroup,
  MenuDivider,
} from "@chakra-ui/react";

import { shortenAddress } from "utils/format";
import { AuthStatus, useAuth } from "components/providers/auth";
import { Avatar } from "components/avatar";
import toast from "react-hot-toast";

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
        backgroundColor="oxfordBlue"
        borderBottomWidth="1px"
        borderColor="gray.800"
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
          <Menu size="xl">
            <MenuButton as={UserMenuButton} address={displayAddress} />
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

const UserMenuItem = (props: MenuItemProps) => (
  <MenuItem
    bgColor="gray.900"
    _hover={{
      bgColor: "gray.700",
    }}
    {...props}
  />
);

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
        borderRadius="sm"
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
          <Avatar size={32} name={name ?? "anon"} image={image} />
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
