import Image from "next/image";
import { PostType } from "@prisma/client";
import { Box, Heading, Link as CLink } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import React, { memo } from "react";
import { Tweet } from "react-tweet";

import { Markdown } from "components/markdown";
import { OG } from "components/post/og";
import dynamic from "next/dynamic";

const YouTubeVideo = dynamic(
  () => import("components/video/youtube").then((mod) => mod.YouTubeVideo),
  {
    ssr: false,
    loading: () => <VideoPlaceholder />,
  }
);

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
        return (
          <>
            <Heading my="6" as="h1">
              {title}
            </Heading>
            <YouTubeVideo uri={uri} />
          </>
        );
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

interface VideoPlaceholderProps {
  children?: React.ReactNode;
}

const VideoPlaceholder = ({ children = null }: VideoPlaceholderProps) => {
  return (
    <Box display="flex" justifyContent="center" width="100%">
      <Box width="100%" maxWidth="640px">
        <Box
          position="relative"
          width="100%"
          paddingBottom="56.25%"
          backgroundColor="gray.600"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
