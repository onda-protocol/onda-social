import Link from "next/link";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { PostWithCommentsCountAndForum } from "lib/api";
import { Markdown } from "../markdown";
import { PostMeta } from "../post/meta";
import { PostButtons } from "./buttons";

interface PostListItemProps {
  post: PostWithCommentsCountAndForum;
}

export const PostListItem = ({ post }: PostListItemProps) => {
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
      onClick={() => router.push(`/comments/${post.id}`)}
    >
      <PostMeta
        author={post.author}
        forum={post.forum}
        createdAt={String(post.createdAt)}
      />
      <Box overflow="hidden">
        <Heading my="4" fontSize="xl" fontWeight="semibold">
          {post.title}
        </Heading>
        <Box position="relative" maxHeight="250px">
          <Markdown>{post.body ?? ""}</Markdown>
          <Box
            position="absolute"
            inset={0}
            background="linear-gradient(to bottom, transparent 100px, #090A20)"
          />
        </Box>
      </Box>
      <PostButtons post={post} />
    </Box>
  );
};
