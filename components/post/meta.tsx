import Link from "next/link";
import Image from "next/image";
import { Box, Text, chakra } from "@chakra-ui/react";
import { useMemo } from "react";

import { getImageFromAddress, getNameFromAddress } from "utils/profile";
import dayjs from "../../lib/dayjs";
import { shortenAddress } from "utils/format";

interface PostMetaProps {
  author?: string;
  createdAt?: string;
  forum?: string;
}

const ChakraImage = chakra(Image);

const Dot = () => (
  <Box as="span" fontSize="xxs" color="gray.500">
    &nbsp;•&nbsp;
  </Box>
);

export const PostMeta = ({ author, forum, createdAt }: PostMetaProps) => {
  const authorAddress = useMemo(
    () => (author ? shortenAddress(author) : null),
    [author]
  );
  const forumName = useMemo(
    () => (forum ? getNameFromAddress(forum) : null),
    [forum]
  );
  const forumImage = useMemo(
    () => (forum ? getImageFromAddress(forum) : null),
    [forum]
  );
  const time = useMemo(
    () => (createdAt ? dayjs.unix(Number(createdAt)).fromNow() : null),
    [createdAt]
  );

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
    return false;
  }

  return (
    <Box display="flex" alignItems="center">
      {forum && (
        <Link href={`/o/${forum}`} onClick={handleClick}>
          <Box as="span" display="flex" alignItems="center">
            {forumName && forumImage && (
              <Box mr="2">
                <Image
                  height={24}
                  width={24}
                  alt={forumName}
                  src={forumImage}
                  style={{
                    borderRadius: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}
            <Text
              fontSize="xs"
              fontWeight="medium"
              color="gray.300"
              _hover={{
                cursor: "pointer",
              }}
            >
              <Text as="span">o/{forumName}</Text>
              <Dot />
            </Text>
          </Box>
        </Link>
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
