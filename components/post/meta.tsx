import Link from "next/link";
import Image from "next/image";
import { Box, Text, useQuery } from "@chakra-ui/react";
import { useMemo } from "react";
import { User } from "@prisma/client";

import { getImageFromAddress, getNameFromAddress } from "utils/profile";
import { shortenAddress } from "utils/format";
import dayjs from "lib/dayjs";

interface PostMetaProps {
  author: User;
  likes: number;
  createdAt?: string;
  editedAt?: string | null;
  forum: string;
  forumNamespace: string | null;
  forumIcon: string | null;
  showRewards?: boolean;
  displayAvatar?: boolean;
}

const Dot = () => (
  <Box as="span" fontSize="xxs" color="gray.500">
    &nbsp;•&nbsp;
  </Box>
);

export const PostMeta: React.FC<PostMetaProps> = ({
  author,
  likes,
  createdAt,
  editedAt,
  forum,
  forumNamespace,
  forumIcon,
  showRewards = false,
  displayAvatar = false,
}) => {
  const authorAddress = useMemo(
    () => (author?.id ? shortenAddress(author.id) : null),
    [author]
  );
  const time = useMemo(
    () => (createdAt ? dayjs.unix(Number(createdAt)).fromNow() : null),
    [createdAt]
  );
  const lastEdited = useMemo(
    () => (editedAt ? dayjs.unix(Number(editedAt)).fromNow() : null),
    [editedAt]
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
              {forumIcon && (
                <Box mr="2">
                  <Image
                    height={24}
                    width={24}
                    alt="forum icon"
                    src={forumIcon}
                    style={{
                      borderRadius: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}
              <Text as="span" color="inherit">
                <Text as="span" color="inherit">
                  o/{forumNamespace ?? shortenAddress(forum)}
                </Text>
                <Dot />
              </Text>
            </Box>
          </Link>
        </Text>
      )}
      <Text as="span" fontSize="sm">
        <Box
          as="span"
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            as="span"
            color="gray.300"
            _hover={{
              color: "gray.400",
            }}
          >
            <Link href={`/u/${author?.id}`} onClick={handleClick}>
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
              <Text as="span" color="inherit">
                {forum ? "Posted by " : ""} {author?.name ?? authorAddress}
              </Text>
            </Link>
          </Box>
          <>&nbsp;&nbsp;</>
          <Text as="span" color="gray.500">
            {time}
          </Text>
          {lastEdited ? (
            <>
              <Dot />
              <Text as="span" color="gray.500">
                last edited&nbsp;
                {lastEdited}
              </Text>
            </>
          ) : null}
        </Box>
      </Text>
      {showRewards && likes >= 10 && (
        <Box ml="2">
          <Image
            alt="Plank icon"
            src="https://spl6zzbxyf3yvcbh2ltohntq24pfsxpl2n3rpr7t7twqfcszee5q.arweave.net/k9fs5DfBd4qIJ9Lm47Zw1x5ZXevTdxfH8_ztAopZITs"
            height={16}
            width={16}
            style={{
              borderRadius: "2px",
            }}
          />
        </Box>
      )}
    </Box>
  );
};
