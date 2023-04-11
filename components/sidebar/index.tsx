import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";

import { Avatar } from "../avatar";

export const Sidebar = () => {
  return (
    <Box my="6">
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
    <Box my="2">
      <Link href={href}>
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          p="4"
          w="180px"
          borderRadius="6"
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
