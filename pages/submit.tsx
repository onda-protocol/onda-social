import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Container, Heading } from "@chakra-ui/react";
import { Editor } from "../components/editor";

const Submit: NextPage = () => {
  const router = useRouter();
  const forum = router.query.o as string | undefined;
  console.log("router", forum, router.query.o);
  return (
    <Container maxW="2xl">
      <Heading size="md" my="9">
        Create a post
      </Heading>
      <Editor
        config={{ type: "post", forum }}
        invalidateQueries={["posts"]}
        redirect="/"
        buttonLabel="Post"
        successMessage="Post created!"
      />
    </Container>
  );
};

export default Submit;
