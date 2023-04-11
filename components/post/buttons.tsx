import Link from "next/link";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IoChatbox, IoHeart } from "react-icons/io5";
import { MouseEventHandler } from "react";

import { Markdown } from "../markdown";
import { PostMeta } from "../post/meta";

interface PostButtonsProps {
  id: string;
  commentCount: number;
}

export const PostButtons = ({ id, commentCount }: PostButtonsProps) => {
  return (
    <Box display="flex" flexDirection="row" gap="2" mt="6">
      <Link href={`/comments/${id}`}>
        <PostButton icon={<IoChatbox />} label={`${commentCount} comments`} />
      </Link>
      <PostButton icon={<IoHeart />} label={`0`} />
    </Box>
  );
};

interface PostButtonProps {
  label: string;
  icon?: JSX.Element;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const PostButton = ({ label, icon, onClick }: PostButtonProps) => {
  return (
    <Box
      p="2"
      display="flex"
      alignItems="center"
      borderRadius="md"
      bgColor="whiteAlpha.50"
      width="fit-content"
      userSelect="none"
      _hover={{
        backgroundColor: "whiteAlpha.100",
      }}
      _focus={{
        backgroundColor: "whiteAlpha.200",
      }}
      onClick={onClick}
    >
      {icon ?? null}
      <Text as="span" fontSize="xs" color="gray.600" ml={icon ? "2" : "0"}>
        {label}
      </Text>
    </Box>
  );
};
