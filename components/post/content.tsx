import { useMemo } from "react";
import Image from "next/image";
import { PostType, User } from "@prisma/client";
import { Box, Heading, Link as CLink } from "@chakra-ui/react";
import { Tweet } from "react-tweet";
import { IoLink } from "react-icons/io5";

import { Markdown } from "components/markdown";

interface PostContentProps {
  type: PostType;
  body: string | null;
  uri: string;
}

export const PostContent = ({ type, body, uri }: PostContentProps) => {
  switch (type) {
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
};
