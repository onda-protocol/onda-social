import Link from "next/link";
import { useRouter } from "next/router";
import { Box, Heading, Text } from "@chakra-ui/react";

import { Markdown } from "../markdown";
import { PostMeta } from "../post/meta";
import { IoChatbox } from "react-icons/io5";

interface PostListItemProps {
  id: string;
  author: string;
  forum: string;
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
      <Box mt="6">
        <Link href={`/comments/${id}`}>
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
          >
            <IoChatbox />
            <Text as="span" fontSize="xs" color="gray.600" ml="2">
              {commentCount} comments
            </Text>
          </Box>
        </Link>
      </Box>
    </Box>
  );
};
