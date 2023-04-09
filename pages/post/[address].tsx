import type { NextPage } from "next";
import { Container } from "@chakra-ui/react";
import { useState } from "react";

const Post: NextPage = () => {
  const [value, setValue] = useState("");

  return <Container maxW="container.lg">text</Container>;
};

export default Post;
