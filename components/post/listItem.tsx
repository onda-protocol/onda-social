import { Box, Flex, forwardRef } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { AwardsJson, PostWithCommentsCountAndForum } from "lib/api";
import { Panel } from "components/panel";
import { PostMeta } from "components/post/meta";
import { PostButtons, PostVoteButtons } from "components/post/buttons";
import { PostContent } from "components/post/content";
import { useMemo } from "react";

interface PostListItemProps {
  displayIcon?: boolean;
  post: PostWithCommentsCountAndForum;
}

export const PostListItem = forwardRef<PostListItemProps, "div">(
  function PostListItem({ displayIcon, post }, ref) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const handlePostClick = () => {
      queryClient.setQueryData(["post", post.id], post);
      router.push(
        `${router.pathname}?postId=${post.id}`,
        `/comments/${post.id}`,
        {
          scroll: false,
        }
      );
    };

    const awardsCount = useMemo(
      () => Object.values(post.awards ?? {}).length,
      [post.awards]
    );

    return (
      <Panel
        ref={ref}
        pt="0"
        pl="0"
        pr="0"
        pb="0"
        mb="3"
        _hover={{
          cursor: "pointer",
          borderColor: "gray.600",
        }}
        boxShadow={
          awardsCount > 1
            ? "0 0 4px 3px rgba(49, 130, 206, 0.25), 0 0 4px 3px rgba(49, 130, 206, 0.25)"
            : "md"
        }
        onClick={handlePostClick}
      >
        <Flex>
          <Box flex={0} borderLeftRadius="md" bgColor="whiteAlpha.50" p="1">
            <PostVoteButtons post={post} />
          </Box>
          <Box flex={1} pt="4" pl="4" pr="6" pb="4">
            <PostMeta
              displayAward="small"
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
                clip
                type={post.postType}
                title={post.title}
                body={post.body}
                uri={post.uri}
                flair={post.Flair?.name}
                flairColor={post.Flair?.color}
              />
            </Box>
            <PostButtons post={post} />
          </Box>
        </Flex>
      </Panel>
    );
  }
);
