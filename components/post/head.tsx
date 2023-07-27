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
          createdAt={createdAt}
          editedAt={editedAt}
        />
        <Heading my="6" as="h1">
          {title}
        </Heading>
      </Box>
      <Box mb="6">
        <PostContent type={postType} body={body} uri={uri} />
      </Box>
    </>
  );
};
