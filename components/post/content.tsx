import Image from "next/image";
import { PostType } from "@prisma/client";
import { Box, Heading, Link as CLink, TypographyProps } from "@chakra-ui/react";
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
  titleSize?: TypographyProps["fontSize"];
  body: string | null;
  uri: string;
  clip?: boolean;
}

export const PostContent = memo(function PostContent({
  type,
  title,
  titleSize = "2xl",
  body,
  uri,
  clip,
}: PostContentProps) {
  const heading = (
    <Heading mt="6" mb="4" as="h2" fontSize={titleSize} fontWeight="semibold">
      {title}
    </Heading>
  );

  switch (type) {
    case PostType.TEXT: {
      return (
        <>
          {heading}
          <Box
            position="relative"
            width="100%"
            maxHeight={clip ? "250px" : "auto"}
            overflow="hidden"
          >
            <Markdown>{body ?? ""}</Markdown>
            {clip ? (
              <Box
                position="absolute"
                inset={0}
                background="linear-gradient(to bottom, transparent 100px, var(--chakra-colors-onda-1000))"
              />
            ) : null}
          </Box>
        </>
      );
    }

    case PostType.IMAGE: {
      return (
        <>
          {heading}
          <Box
            position="relative"
            width="100%"
            maxHeight="512px"
            overflow="hidden"
            sx={{
              "&:before": {
                content: '""',
                display: "block",
                paddingBottom: "100%",
              },
            }}
          >
            <Box>
              <Image
                fill
                src={uri}
                alt="background"
                style={{
                  zIndex: 0,
                  filter: "blur(20px) brightness(.8)",
                  opacity: 0.35,
                }}
              />
            </Box>
            <Image
              fill
              src={uri}
              alt="post image"
              style={{
                objectFit: "contain",
                maxWidth: "100%",
                maxHeight: "100%",
                zIndex: 1,
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
              {heading}
              <Box display="flex" justifyContent="center" data-theme="dark">
                <Tweet id={id} />
              </Box>
            </>
          );
        }
      }

      const isYouTube = uri.match(
        /^(https:\/\/youtu\.be\/|https:\/\/(www\.)?youtube\.com\/)/
      );

      if (isYouTube) {
        return (
          <>
            <Heading my="6" as="h1" fontSize={titleSize}>
              {title}
            </Heading>
            <YouTubeVideo uri={uri} />
          </>
        );
      }

      return (
        <Box display="flex" justifyContent="space-between">
          <Box>
            {heading}
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
