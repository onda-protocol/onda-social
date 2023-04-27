import Link from "next/link";
import Image from "next/image";
import { Box, Text } from "@chakra-ui/react";
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
        <Text
          as="span"
          fontSize="sm"
          fontWeight="medium"
          color="gray.100"
          _hover={{
            color: "gray.300",
          }}
        >
          <Link href={`/o/${forum}`} onClick={handleClick}>
            <Box as="span" display="flex" alignItems="center" color="inherit">
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
              <Text as="span" color="inherit">
                <Text as="span" color="inherit">
                  o/{forumName}
                </Text>
                <Dot />
              </Text>
            </Box>
          </Link>
        </Text>
      )}
      <Text
        as="span"
        fontSize="sm"
        color="gray.500"
        _hover={{
          color: "gray.400",
        }}
      >
        <Link href={`/u/${author.id}`}>
          <Box as="span" display="flex" flexDirection="row" alignItems="center">
            {displayAvatar && author.avatar && author.name && (
              <Box as="span" mr="2">
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
            <Text as="span" color="gray.300">
              {forum ? "Posted by " : ""} {author.name ?? authorAddress}
            </Text>
            {forum ? <>&nbsp;</> : <Dot />}
            {time}
          </Box>
        </Link>
      </Text>
    </Box>
  );
};
