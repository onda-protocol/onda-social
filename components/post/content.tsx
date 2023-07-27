import Image from "next/image";
import { PostType } from "@prisma/client";
import { Box, Link as CLink } from "@chakra-ui/react";
import { Tweet } from "react-tweet";

import { Markdown } from "components/markdown";
import { ExternalLinkIcon } from "@chakra-ui/icons";

const MAX_URI_DISPLAY_LENGTH = 72;

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
          <CLink
            href={uri}
            isExternal
            sx={{
              "& svg": {
                display: "inline",
              },
            }}
          >
            {uri.length > MAX_URI_DISPLAY_LENGTH
              ? uri.substring(0, MAX_URI_DISPLAY_LENGTH).concat("...")
              : uri}{" "}
            <ExternalLinkIcon />
          </CLink>
        </Box>
      );
    }
  }
};
