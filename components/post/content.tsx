import Image from "next/image";
import { PostType } from "@prisma/client";
import { Box, Fade, Heading, Link as CLink } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { memo, useState } from "react";
import { Tweet } from "react-tweet";
import YouTube from "react-youtube";

import { Markdown } from "components/markdown";
import { OG } from "components/post/og";

const MAX_URI_DISPLAY_LENGTH = 48;

interface PostContentProps {
  type: PostType;
  title: string;
  body: string | null;
  uri: string;
}

export const PostContent = memo(function PostContent({
  type,
  title,
  body,
  uri,
}: PostContentProps) {
  switch (type) {
    case PostType.TEXT: {
      return (
        <>
          <Heading my="6" as="h1">
            {title}
          </Heading>
          <Markdown>{body ?? ""}</Markdown>
        </>
      );
    }

    case PostType.IMAGE: {
      return (
        <>
          <Heading my="6" as="h1">
            {title}
          </Heading>
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
        </>
      );
    }

    case PostType.LINK: {
      const isTweet = uri.includes("https://twitter.com/");

      if (isTweet) {
        const id = uri.split("?")[0].match(/(\d+)$/)?.[0];

        if (id) {
          return (
            <>
              <Heading my="6" as="h1">
                {title}
              </Heading>
              <Box display="flex" justifyContent="center" data-theme="dark">
                <Tweet id={id} />
              </Box>
            </>
          );
        }
      }

      const isYouTube = uri.match(
        /(https:\/\/youtu\.be\/|https:\/\/youtube\.com\/)?.*/
      );

      if (isYouTube) {
        const id = uri.match(
          /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=)?)([a-zA-Z0-9_-]{11})/
        )?.[1];

        if (id) {
          return (
            <>
              <Heading my="6" as="h1">
                {title}
              </Heading>
              <YouTubeVideoContainer id={id} />
            </>
          );
        }
      }

      return (
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Heading my="6" as="h1">
              {title}
            </Heading>
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
          <OG url={uri} />
        </Box>
      );
    }
  }
});

interface YouTubeVideoContainerProps {
  id: string;
}

const YouTubeVideoContainer = ({ id }: YouTubeVideoContainerProps) => {
  const [isReady, setIsReady] = useState(false);

  return (
    <Box
      position="relative"
      width="100%"
      paddingBottom="56.25%"
      backgroundColor="gray.600"
    >
      <Box position="absolute" inset={0}>
        <Fade in={isReady}>
          <YouTube videoId={id} onReady={() => setIsReady(true)} />
        </Fade>
      </Box>
    </Box>
  );
};
