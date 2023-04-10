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
    <Link href={`/comments/${id}`}>
      <Box
        p="6"
        borderBottom="1px"
        borderColor="gray.800"
        maxHeight="20ch"
        _hover={{
          backgroundColor: "whiteAlpha.50",
          cursor: "pointer",
        }}
      >
        <Box background="linear-gradient(to bottom, transparent, #090A20)">
          <Heading mb="4" fontSize="xl" fontWeight="semibold">
            {title}
          </Heading>
          <Markdown>{body}</Markdown>
        </Box>
      </Box>
    </Link>
  );
};
