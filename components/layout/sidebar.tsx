import Link from "next/link";
import React from "react";
import { useRouter } from "next/router";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";

import { initForum } from "lib/anchor/actions";
import { Avatar } from "../avatar";
import { getProfiles } from "utils/profile";

export const Sidebar = () => {
  const router = useRouter();

  return (
    <Box my="6" pl="4" position="relative">
      <Box>
        <Section title="Home">
          <Box px="4">
            <Text fontSize="sm">
              Welcome to Onda Alpha. The place to discover and engage with web3
              Communities, powered by the Solana blockchain, where every post,
              comment and like lives on-chain.
            </Text>
          </Box>
          <SidebarButtons />
        </Section>
        <Section title="Communities">
          {getProfiles().map((profile) => (
            <SidebarItem
              key={profile.id}
              href={`/o/${profile.id}`}
              active={router.query.address === profile.id}
              label={profile.name}
              image={profile.image}
            />
          ))}
        </Section>
      </Box>
    </Box>
  );
};

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <Box as="section" bgColor="whiteAlpha.50" borderRadius="md" pb="1" mb="6">
      {title && (
        <Heading size="md" p="4">
          {title}
        </Heading>
      )}
      {children}
    </Box>
  );
};

interface SidebarItemProps {
  active: boolean;
  href: string;
  image: string;
  label: string;
}

const SidebarItem = ({ active, href, image, label }: SidebarItemProps) => {
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
