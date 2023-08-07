import { PostType, User } from "@prisma/client";
import { Box, Heading } from "@chakra-ui/react";

import { PostMeta } from "components/post/meta";
import { PostContent } from "components/post/content";

interface PostHeadProps {
  title: string;
  body: string | null;
  uri: string;
  author: User;
  likes: number;
  createdAt: string;
  editedAt: string | null;
  forum: string;
  forumNamespace: string | null;
  forumIcon: string | null;
  postType: PostType;
}

export const PostHead = ({
  title,
  body,
  uri,
  author,
  likes,
  createdAt,
  editedAt,
  forum,
  forumNamespace,
  forumIcon,
  postType,
}: PostHeadProps) => {
  return (
    <>
      <Box mt="12">
        <PostMeta
          showRewards
          likes={Number(likes)}
          author={author}
          forum={forum}
          forumNamespace={forumNamespace}
          forumIcon={forumIcon}
          createdAt={createdAt}
          editedAt={editedAt}
        />
      </Box>
      <Box mb="6">
        <PostContent type={postType} title={title} body={body} uri={uri} />
      </Box>
    </>
  );
};
