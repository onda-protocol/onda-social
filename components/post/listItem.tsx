import { Box, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { AwardsJson, PostWithCommentsCountAndForum } from "lib/api";
import { Panel } from "components/panel";
import { PostMeta } from "components/post/meta";
import { PostButtons } from "components/post/buttons";
import { PostContent } from "components/post/content";

interface PostListItemProps {
  displayIcon?: boolean;
  post: PostWithCommentsCountAndForum;
}

export const PostListItem = ({ displayIcon, post }: PostListItemProps) => {
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
        displayIcon={displayIcon}
        author={post.Author}
        points={Number(post.points)}
        awards={post.awards as AwardsJson}
        forum={post.forum}
        forumNamespace={post.Forum.namespace}
        forumIcon={post.Forum.icon}
        createdAt={String(post.createdAt)}
      />
      <Box overflow="hidden">
        <PostContent
          type={post.postType}
          title={post.title}
          body={post.body}
          uri={post.uri}
        />
      </Box>
      <PostButtons post={post} />
    </Panel>
  );
};
