import Link from "next/link";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IoChatbox, IoHeart } from "react-icons/io5";
import { MouseEventHandler } from "react";

import { Markdown } from "../markdown";
import { PostMeta } from "../post/meta";
import { PostButtons } from "./buttons";

interface PostListItemProps {
  id: string;
  author: string;
  forum?: string;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
}

export const PostListItem = ({
  id,
  author,
  forum,
  title,
  body,
  createdAt,
  commentCount,
}: PostListItemProps) => {
  const router = useRouter();

  return (
    <Box
      pt="6"
      pl="6"
      pr="6"
      pb="4"
      borderBottom="1px"
      borderColor="gray.800"
      _hover={{
        cursor: "pointer",
      }}
      onClick={() => router.push(`/comments/${id}`)}
    >
      <PostMeta author={author} forum={forum} createdAt={String(createdAt)} />
      <Box overflow="hidden">
        <Heading my="4" fontSize="xl" fontWeight="semibold">
          {title}
        </Heading>
        <Box position="relative" maxHeight="250px">
          <Markdown>{body}</Markdown>
          <Box
            position="absolute"
            inset={0}
            background="linear-gradient(to bottom, transparent 100px, #090A20)"
          />
        </Box>
      </Box>
      <PostButtons id={id} commentCount={commentCount} />
    </Box>
  );
};
