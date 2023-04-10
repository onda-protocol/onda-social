import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import dayjs from "../../lib/dayjs";

interface PostMetaProps {
  author?: string;
  createdAt?: string;
  forum?: string;
}

const Dot = () => (
  <Box as="span" fontSize="xxs" color="gray.500">
    &nbsp;•&nbsp;
  </Box>
);

export const PostMeta = ({ author, forum, createdAt }: PostMetaProps) => {
  const authorAddress = useMemo(
    () => (author ? `${author.slice(0, 4)}...${author.slice(-4)}` : null),
    [author]
  );
  const forumAddress = useMemo(
    () => (forum ? `${forum.slice(0, 4)}...${forum.slice(-4)}` : null),
    [forum]
  );
  const time = useMemo(
    () => (createdAt ? dayjs.unix(Number(createdAt)).fromNow() : null),
    [createdAt]
  );

  return (
    <Box display="flex">
      {forum && (
        <Text
          fontSize="xs"
          fontWeight="medium"
          color="gray.300"
          _hover={{
            cursor: "pointer",
          }}
        >
          <Link href={`/o/${forum}`}>o/{forumAddress}</Link>
          <Dot />
        </Text>
      )}
      <Text fontSize="xs" color="gray.500">
        <a
          href={`https://explorer.solana.com/address/${author}`}
          target="_blank"
          rel="noreferrer"
        >
          {forum ? "Posted by " : ""} {authorAddress}
          {forum ? " " : <Dot />}
          {time}
        </a>
      </Text>
    </Box>
  );
};
