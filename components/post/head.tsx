import { useMemo } from "react";
import Image from "next/image";
import { PostType, User } from "@prisma/client";
import { Box, Heading, Link as CLink } from "@chakra-ui/react";
import { Tweet } from "react-tweet";
import { IoLink } from "react-icons/io5";

import { Markdown } from "components/markdown";
import { PostMeta } from "components/post/meta";

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

      case PostType.LINK: {
        const isTweet = uri.includes("twitter.com/");

        if (isTweet) {
          const id = uri.match(/\/(\d+)$/)?.[0];

          if (id) {
            return (
              <Box display="flex" justifyContent="center" data-theme="dark">
                <Tweet id={id.replace("/", "")} />
              </Box>
            );
          }
        }

        return (
          <Box>
            <CLink href="https://chakra-ui.com" isExternal>
              Chakra Design system <IoLink />
            </CLink>
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
