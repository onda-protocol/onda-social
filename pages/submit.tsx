import type { NextPage } from "next";
import { Container, Heading } from "@chakra-ui/react";
import { Editor } from "../components/editor";

const Submit: NextPage = () => {
  return (
    <Container maxW="container.sm">
      <Heading size="md" my="6">
        Create a post
      </Heading>
      <Editor
        config={{ type: "post" }}
        invalidateQueries={["posts"]}
        redirect="/"
        buttonLabel="Post"
        successMessage="Post created!"
      />
    </Container>
  );
};

export default Submit;
