import { Flair, PostType, User } from "@prisma/client";
import { Box, Heading, TypographyProps } from "@chakra-ui/react";

import { PostMeta } from "components/post/meta";
import { PostContent } from "components/post/content";
import { AwardsJson } from "lib/api";

interface PostHeadProps {
  title: string;
  body: string | null;
  uri: string;
  author: User;
  flair: Flair | null;
  points: number;
  awards: AwardsJson;
  createdAt: string;
  editedAt: string | null;
  forum: string;
  forumNamespace: string | null;
  forumIcon: string | null;
  titleSize?: TypographyProps["fontSize"];
  postType: PostType;
}

export const PostHead = ({
  title,
  body,
  uri,
  author,
  flair,
  points,
  awards,
  createdAt,
  editedAt,
  forum,
  forumNamespace,
  forumIcon,
  postType,
  titleSize,
}: PostHeadProps) => {
  return (
    <>
      <Box>
        <PostMeta
          displayAward="large"
          points={Number(points)}
          awards={awards}
          author={author}
          forum={forum}
          forumNamespace={forumNamespace}
          forumIcon={forumIcon}
          createdAt={createdAt}
          editedAt={editedAt}
        />
      </Box>
      <Box mb="6">
        <PostContent
          flair={flair?.name}
          flairColor={flair?.color}
          type={postType}
          titleSize={titleSize}
          title={title}
          body={body}
          uri={uri}
        />
      </Box>
    </>
  );
};
