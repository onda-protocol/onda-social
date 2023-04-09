import type { NextPage } from "next";
import { Container } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import "easymde/dist/easymde.min.css";

const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

const Post: NextPage = () => {
  const [value, setValue] = useState("");

  return (
    <Container maxW="container.lg">
      <SimpleMDE value={value} onChange={setValue} />
    </Container>
  );
};

export default Post;
