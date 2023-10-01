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
import { useLayoutEffect, useMemo } from "react";
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
          backgroundColor="blackAlpha.800"
          zIndex={1}
          onClick={() =>
            router.push("/", "/", {
              scroll: false,
            })
          }
        >
          <Container
            left="0"
            top="56px"
            maxW="container.lg"
            backgroundColor="onda.1050"
          >
            <Flex height="42px" align="center" justify="space-between">
              <Flex align="center">
                <Box pr="2" color="gray.300">
                  {icon}
                </Box>
                <Heading fontSize="md" fontWeight="medium" color="gray.300">
                  {postQuery.data?.title}
                </Heading>
              </Flex>

              <Button
                as={Link}
                href="/"
                scroll={false}
                variant="ghost"
                fontSize="sm"
                leftIcon={<IoClose size={18} />}
              >
                Close
              </Button>
            </Flex>
          </Container>
          <Box height="calc(100% - 42px)" width="100%" overflowY="scroll">
            <Container
              maxW="container.lg"
              minH="100%"
              backgroundColor="onda.1000"
              pt="6"
            >
              <Container
                maxW="container.md"
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
