import { useMemo } from "react";
import Image from "next/image";
import { PostType, User } from "@prisma/client";
import { Box, Container, Divider, Heading, Spinner } from "@chakra-ui/react";

import { Editor } from "components/editor";
import { Markdown } from "components/markdown";
import { CommentListItem } from "components/comment";
import { PostMeta } from "components/post/meta";
import { PostButtons } from "components/post/buttons";

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
  const content = useMemo(() => {
    switch (postType) {
      case PostType.TEXT: {
        return <Markdown>{body ?? ""}</Markdown>;
      }

      case PostType.IMAGE: {
        return (
          <Box
            position="relative"
            width="100%"
            maxHeight="512px"
            sx={{
              "&:before": {
                content: '""',
                display: "block",
                paddingBottom: "100%",
              },
            }}
          >
            <Image
              fill
              src={uri}
              alt="post image"
              style={{
                objectFit: "cover",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </Box>
        );
      }
    }
  }, [body, uri, postType]);

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
      <Box mb="6">{content}</Box>
    </>
  );
};
