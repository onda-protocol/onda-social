import Link from "next/link";
import Image from "next/image";
import { Box, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { User } from "@prisma/client";

import { shortenAddress } from "utils/format";
import { AwardsJson } from "lib/api";
import dayjs from "lib/dayjs";

interface PostMetaProps {
  author: User;
  points: number;
  awards: null | AwardsJson;
  createdAt?: string;
  editedAt?: string | null;
  forum?: string;
  forumNamespace?: string | null;
  forumIcon?: string | null;
  displayIcon?: boolean;
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
  points,
  awards,
  createdAt,
  editedAt,
  forum,
  forumNamespace,
  forumIcon,
  displayIcon = true,
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

  const awardsEl = useMemo(() => {
    if (awards) {
      const awardsArray = Object.entries(awards);

      return awardsArray.map(([awardId, award]) => (
        <Box ml="2" key={awardId}>
          <Image
            alt="Award"
            src={award.image}
            height={16}
            width={16}
            style={{
              borderRadius: "2px",
            }}
          />
        </Box>
      ));
    }

    return null;
  }, [awards]);

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
          <Link href={`/o/${forumNamespace}`} onClick={handleClick}>
            <Box as="span" display="flex" alignItems="center" color="inherit">
              {displayIcon && forumIcon && (
                <Box mr="2">
                  <Image
                    height={24}
                    width={24}
                    alt="forum icon"
                    src={forumIcon + "?discriminator=1"}
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
          <Link href={`/u/${author?.id}`} onClick={handleClick}>
            <Box
              as="span"
              display="flex"
              alignItems="center"
              color="gray.300"
              _hover={{
                color: "gray.400",
              }}
            >
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
            </Box>
          </Link>
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
      {awardsEl}
    </Box>
  );
};
