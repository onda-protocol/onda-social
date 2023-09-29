import { useRouter } from "next/router";
import Link from "next/link";
import { Box, Container, Portal, Fade, Button } from "@chakra-ui/react";

import { Comments } from "components/comment/comments";
import { IoArrowBack } from "react-icons/io5";
import { useLayoutEffect } from "react";

export const PostModal = () => {
  const router = useRouter();
  const postId = router.query?.postId as string | undefined;

  useLayoutEffect(() => {
    if (postId) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [postId]);

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
          zIndex="modal"
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
            <Button
              aria-label="Back Button"
              as={Link}
              href="/"
              scroll={false}
              variant="ghost"
              leftIcon={<IoArrowBack />}
            >
              Back
            </Button>
          </Container>
          <Box height="calc(100% - 42px)" width="100%" overflowY="scroll">
            <Container maxW="container.lg" backgroundColor="onda.1000" pt="6">
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
