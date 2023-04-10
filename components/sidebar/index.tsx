import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";

import { Avatar } from "../avatar";

export const Sidebar = () => {
  return (
    <Box my="6">
      <SidebarItem
        href="/o/DdZsY59wtUaqyAR3rfCCgouWvhwWfzoWCCvYC61DcSoY"
        label="ChickenTribe"
        image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
      />
      <SidebarItem
        href="/o/DdZsY59wtUaqyAR3rfCCgouWvhwWfzoWCCvYC61DcSoY"
        label="ChickenTribe"
        image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
      />
      <SidebarItem
        href="/o/DdZsY59wtUaqyAR3rfCCgouWvhwWfzoWCCvYC61DcSoY"
        label="ChickenTribe"
        image="https://chickentribe.s3.us-west-2.amazonaws.com/collection.png"
      />
      <SidebarItem
        href="/o/DdZsY59wtUaqyAR3rfCCgouWvhwWfzoWCCvYC61DcSoY"
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
          p="2"
          w="36"
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
