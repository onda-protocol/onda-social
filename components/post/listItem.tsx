import { Box, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { PostWithCommentsCountAndForum } from "lib/api";
import { Panel } from "components/panel";
import { PostMeta } from "components/post/meta";
import { PostButtons } from "components/post/buttons";
import { PostContent } from "components/post/content";

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
        likes={Number(post.likes)}
        forum={post.forum}
        createdAt={String(post.createdAt)}
      />
      <Box overflow="hidden">
        <Heading my="4" fontSize="2xl" fontWeight="semibold">
          {post.title}
        </Heading>
        <PostContent type={post.postType} body={post.body} uri={post.uri} />
      </Box>
      <PostButtons post={post} />
    </Panel>
  );
};
