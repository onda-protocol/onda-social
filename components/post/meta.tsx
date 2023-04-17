import Link from "next/link";
import Image from "next/image";
import { Box, Text, chakra } from "@chakra-ui/react";
import { useMemo } from "react";
import { User } from "@prisma/client";

import { getImageFromAddress, getNameFromAddress } from "utils/profile";
import { shortenAddress } from "utils/format";
import dayjs from "lib/dayjs";

interface PostMetaProps {
  author: User;
  createdAt?: string;
  forum?: string;
  displayAvatar?: boolean;
}

const Dot = () => (
  <Box as="span" fontSize="xxs" color="gray.500">
    &nbsp;•&nbsp;
  </Box>
);

export const PostMeta: React.FC<PostMetaProps> = ({
  author,
  forum,
  createdAt,
  displayAvatar = false,
}) => {
  const authorAddress = useMemo(
    () => (author?.id ? shortenAddress(author.id) : null),
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
        <Link href={`/u/${author.id}`}>
          <Box as="span" display="flex" flexDirection="row" alignItems="center">
            {displayAvatar && author.avatar && author.name && (
              <Box mr="2">
                <Image
                  height={28}
                  width={28}
                  alt={author.name}
                  src={author.avatar}
                  style={{
                    borderRadius: "100%",
                  }}
                />
              </Box>
            )}
            {forum ? "Posted by " : ""} {author.name ?? authorAddress}
            {forum ? " " : <Dot />}
            {time}
          </Box>
        </Link>
      </Text>
    </Box>
  );
};
