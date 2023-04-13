import Link from "next/link";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

import { Avatar } from "../avatar";
import React from "react";

export const Sidebar = () => {
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
          <SidebarItem
            href="/o/7NDfZJ64xXtZqsLvGgxkJh48iZ7priEHp8MnCH5DCert"
            label="ChickenTribe"
            image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
          />
          <SidebarItem
            href="/o/7NDfZJ64xXtZqsLvGgxkJh48iZ7priEHp8MnCH5DCert"
            label="ChickenTribe"
            image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
          />
          <SidebarItem
            href="/o/7NDfZJ64xXtZqsLvGgxkJh48iZ7priEHp8MnCH5DCert"
            label="ChickenTribe"
            image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
          />
          <SidebarItem
            href="/o/7NDfZJ64xXtZqsLvGgxkJh48iZ7priEHp8MnCH5DCert"
            label="Breadheads"
            image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
          />
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
  href: string;
  image: string;
  label: string;
}

const SidebarItem = ({ href, image, label }: SidebarItemProps) => {
  return (
    <Box my="2" w="100%">
      <Link href={href}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          p="4"
          _hover={{
            backgroundColor: "whiteAlpha.100",
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
      <Button disabled={true} width="100%" borderRadius="lg" variant="outline">
        Create Community
      </Button>
    </Box>
  );
};
