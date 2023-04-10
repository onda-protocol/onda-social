import Link from "next/link";
import { Box, Heading } from "@chakra-ui/react";
import { Markdown } from "../markdown";

interface PostListItemProps {
  id: string;
  title: string;
  body: string;
}

export const PostListItem = ({ id, title, body }: PostListItemProps) => {
  return (
    <Link href={`/post/${id}`}>
      <Box
        p="4"
        m="4"
        borderWidth="1px"
        borderColor="gray.800"
        borderRadius="md"
      >
        <Heading mb="2" fontSize="lg" fontWeight="semibold">
          {title}
        </Heading>
        <Markdown>{body}</Markdown>
      </Box>
    </Link>
  );
};
