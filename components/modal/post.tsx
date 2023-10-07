import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Container,
  Fade,
  Flex,
  Heading,
  Portal,
} from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { IoClose, IoDocumentText, IoLink } from "react-icons/io5";

import { SerializedPost } from "lib/api";
import { Comments } from "components/comment/comments";
import { PostType } from "@prisma/client";

export const PostModal = () => {
  const router = useRouter();
  const postId = router.query?.postId as string | undefined;

  const postQueryKey = useMemo(() => ["post", postId], [postId]);
  const postQuery = useQuery<unknown, unknown, SerializedPost>({
    queryKey: postQueryKey,
    refetchOnMount: false,
  });
  const post = postQuery.data;

  useLayoutEffect(() => {
    if (postId) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [postId]);

  useEffect(() => {
    if (postId) {
      router.beforePopState(({ url, as }) => {
        router.replace(url, as, { scroll: false });
        return false;
      });

      return () => {
        router.beforePopState(() => true);
      };
    }
  }, [router, postId]);

  const icon = useMemo(() => {
    switch (post?.postType) {
      case PostType.TEXT:
        return <IoDocumentText />;

      case PostType.LINK:
        return <IoLink />;

      default:
        return null;
    }
  }, [post]);

  return (
    <Portal>
      <Fade in={Boolean(postId)} unmountOnExit>
        <Box
          position="fixed"
          inset={0}
          top="56px"
          height="calc(100% - 56px)"
          width="100%"
          zIndex={2}
        >
          <Box
            position="absolute"
            inset={0}
            backgroundColor="blackAlpha.700"
            zIndex={-1}
            onClick={() => router.back()}
          />
          <Box height="100%" width="100%" overflowY="auto">
            <Container
              position="relative"
              maxW="container.lg"
              minH="100%"
              backgroundColor="onda.1000"
              pt="42px"
            >
              <Box
                position="fixed"
                top="56px"
                left="0"
                right="0"
                backgroundColor="onda.1050"
                zIndex={2}
              >
                <Flex
                  height="42px"
                  width="100%"
                  maxWidth="100%"
                  align="center"
                  justify="space-between"
                  px="4"
                >
                  <Flex maxWidth="calc(100% - 72px)" align="center">
                    <Box pr="2" color="gray.300">
                      {icon}
                    </Box>
                    <Heading
                      fontSize="md"
                      fontWeight="medium"
                      color="gray.300"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {postQuery.data?.title}
                    </Heading>
                  </Flex>

                  <Button
                    variant="ghost"
                    fontSize="sm"
                    leftIcon={<IoClose size={18} />}
                    onClick={() => {
                      const backPath = (router.query.from as string) ?? "/";
                      router.replace(backPath, backPath, {
                        scroll: false,
                      });
                    }}
                  >
                    Close
                  </Button>
                </Flex>
              </Box>
              <Container
                maxW="container.md"
                pt="4"
                paddingLeft="0"
                paddingRight="0"
                onClick={(e) => {
                  e.stopPropagation();
                  return false;
                }}
              >
                {postId ? <Comments postId={postId} /> : null}
              </Container>
            </Container>
          </Box>
        </Box>
      </Fade>
    </Portal>
  );
};
