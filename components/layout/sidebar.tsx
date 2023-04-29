import Link from "next/link";
import React from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Box,
  Button,
  Heading,
  Text,
  List,
  ListItem,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useMutation } from "@tanstack/react-query";

import { initForum } from "lib/anchor/actions";
import { Avatar } from "../avatar";
import { Panel } from "../panel";

interface SidebarProps {
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <Box my="2" pl="4" position="relative">
      {children}
    </Box>
  );
};

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

export const SidebarSection: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <Panel as="aside" p="0" pb="1" mb="6">
      {title && (
        <Heading
          fontSize="lg"
          letterSpacing="1%"
          fontWeight="semibold"
          p="4"
          color="gray.300"
        >
          {title}
        </Heading>
      )}
      {children}
    </Panel>
  );
};

interface SidebarItemProps {
  active: boolean;
  href: string;
  image: string;
  label: string;
}

export const SidebarItem = ({
  active,
  href,
  image,
  label,
}: SidebarItemProps) => {
  return (
    <Box my="2" w="100%">
      <Link href={href}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          p="4"
          backgroundColor={active ? "whiteAlpha.100" : "transparent"}
          _hover={{
            backgroundColor: "whiteAlpha.200",
          }}
        >
          <Box minW="24px" mr="2">
            <Avatar name={label} image={image} size={24} />
          </Box>
          <Text as="span" fontSize="sm" wordBreak="break-word">
            {label}
          </Text>
        </Box>
      </Link>
    </Box>
  );
};

export const SidebarButtons = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const initForumMutation = useMutation(async () => {
    if (!anchorWallet) {
      throw new Error("Wallet not connected");
    }

    return initForum(connection, anchorWallet);
  });

  return (
    <Box my="6" mx="4">
      <Button
        as={Link}
        href="/submit"
        width="100%"
        borderRadius="lg"
        variant="solid"
        mb="2"
      >
        Create Post
      </Button>
      <Button
        // isDisabled
        width="100%"
        borderRadius="lg"
        variant="outline"
        isLoading={initForumMutation.isLoading}
        onClick={() => initForumMutation.mutate()}
      >
        Create Community
      </Button>
    </Box>
  );
};

interface SidebarListProps {
  children: React.ReactNode;
}

export const SidebarList: React.FC<SidebarListProps> = ({ children }) => {
  return (
    <List px="4" pb="4">
      {children}
    </List>
  );
};

interface SidebarLinkProps {
  href: string;
  label: string;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ href, label }) => {
  return (
    <ListItem mb="2">
      <ChakraLink href={href} isExternal>
        {label}
        <ExternalLinkIcon mx="2px" />
      </ChakraLink>
    </ListItem>
  );
};
