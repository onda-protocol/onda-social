import { Box, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { PostWithCommentsCountAndForum } from "lib/api";
import { Markdown } from "../markdown";
import { PostMeta } from "../post/meta";
import { Panel } from "../panel";
import { PostButtons } from "./buttons";

interface PostListItemProps {
  post: PostWithCommentsCountAndForum;
}

export const PostListItem = ({ post }: PostListItemProps) => {
  const router = useRouter();

  return (
    <Panel
      _hover={{
        cursor: "pointer",
        borderColor: "gray.600",
      }}
      onClick={() => router.push(`/comments/${post.id}`)}
    >
      <PostMeta
        author={post.Author}
        forum={post.forum}
        createdAt={String(post.createdAt)}
      />
      <Box overflow="hidden">
        <Heading my="4" fontSize="2xl" fontWeight="semibold">
          {post.title}
        </Heading>
        <Box position="relative" maxHeight="250px">
          <Markdown>{post.body ?? ""}</Markdown>
          <Box
            position="absolute"
            inset={0}
            background="linear-gradient(to bottom, transparent 100px, var(--chakra-colors-onda-950))"
          />
        </Box>
      </Box>
      <PostButtons post={post} />
    </Panel>
  );
};
