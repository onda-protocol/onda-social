import type { NextPage } from "next";
import { Container } from "@chakra-ui/react";
import { Editor } from "../components/editor";

const Submit: NextPage = () => {
  return (
    <Container maxW="container.sm">
      <Editor
        config={{ type: "post" }}
        invalidateQueries={["posts"]}
        redirect="/"
        successMessage="Post created!"
      />
    </Container>
  );
};

export default Submit;
