import Link from "next/link";
import Image from "next/image";
import { Box, Text, Tooltip, Wrap, WrapItem } from "@chakra-ui/react";
import { useMemo } from "react";
import { User } from "@prisma/client";

import { shortenAddress } from "utils/format";
import { AwardsJson } from "lib/api";
import dayjs from "lib/dayjs";

interface PostMetaProps {
  isOp?: boolean;
  author: User;
  points: number;
  awards: null | AwardsJson;
  createdAt?: string;
  editedAt?: string | null;
  forum?: string;
  forumNamespace?: string | null;
  forumIcon?: string | null;
  displayIcon?: boolean;
  displayAward?: "large" | "small" | "xsmall";
  displayAvatar?: boolean;
}

const Dot = () => (
  <Box as="span" fontSize="xx-small" color="gray.500" mx="0.5">
    &nbsp;•&nbsp;
  </Box>
);

export const PostMeta: React.FC<PostMetaProps> = ({
  isOp,
  author,
  awards,
  createdAt,
  editedAt,
  forum,
  forumNamespace,
  forumIcon,
  displayIcon = true,
  displayAward = "",
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
      const awardSize = displayAward === "large" ? 24 : 18;

      return awardsArray.map(([id, meta]) => (
        <WrapItem key={id}>
          <Tooltip label={`${meta.name} x${meta.count}`}>
            <Box
              display="flex"
              alignItems="center"
              borderRadius="md"
              borderWidth={displayAward === "large" ? "1px" : undefined}
              backgroundColor={
                displayAward === "large" ? "prussianBlue" : undefined
              }
              borderColor={
                displayAward === "large" ? "whiteAlpha.200" : undefined
              }
              width="fit-content"
              p="1"
              mt="1"
              _hover={{
                borderColor: "whiteAlpha.300",
                "& .img-container": {
                  transform: "scale(1.1)",
                },
              }}
            >
              <Box className="img-container" transition="all 0.5 ease-out">
                <Image
                  unoptimized
                  alt="Award"
                  src={meta.image}
                  height={awardSize}
                  width={awardSize}
                />
              </Box>
              {displayAward === "large" && (
                <Text
                  color="whiteAlpha.800"
                  fontSize="sm"
                  fontWeight="600"
                  pl="0.5"
                >
                  {meta.count}
                </Text>
              )}
            </Box>
          </Tooltip>
        </WrapItem>
      ));
    }

    return null;
  }, [displayAward, awards]);

  return (
    <Box>
      <Box
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        gap="2"
        width="100%"
      >
        <Box display="flex">
          {forum && (
            <Box
              as="span"
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              whiteSpace="nowrap"
            >
              <Link href={`/o/${forumNamespace}`} onClick={handleClick}>
                <Box
                  as="span"
                  display="flex"
                  alignItems="center"
                  fontSize="sm"
                  fontWeight="medium"
                  color="whiteAlpha.800"
                  _hover={{
                    color: "whiteAlpha.600",
                  }}
                >
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
                  <Text as="span" color="inherit" fontWeight="600">
                    o/{forumNamespace ?? shortenAddress(forum)}
                  </Text>
                </Box>
              </Link>
              <Dot />
            </Box>
          )}
          <Box
            as="span"
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            whiteSpace="nowrap"
            fontSize="sm"
          >
            <Link href={`/u/${author?.id}`} onClick={handleClick}>
              <Box
                as="span"
                display="flex"
                alignItems="center"
                _hover={{
                  textDecoration: "underline",
                }}
              >
                {displayAvatar && author?.avatar && author?.name && (
                  <Box as="span" mr="2">
                    <Image
                      height={24}
                      width={24}
                      alt={author.name}
                      src={author.avatar}
                      style={{
                        borderRadius: "100%",
                      }}
                    />
                  </Box>
                )}
                <Text
                  as="span"
                  color={forum ? "whiteAlpha.600" : "whiteAlpha.800"}
                  fontWeight={forum ? "normal" : "medium"}
                >
                  {forum ? "Posted by " : ""} {author?.name ?? authorAddress}
                </Text>
              </Box>
            </Link>
            {isOp && (
              <Text as="span" fontWeight="bold" fontSize="xs" color="steelBlue">
                &nbsp;OP
              </Text>
            )}
            <Dot />
            <Text as="span" color="whiteAlpha.600">
              {time}
            </Text>
            {lastEdited ? (
              <>
                <Dot />
                <Text as="span" color="whiteAlpha.600">
                  last edited&nbsp;
                  {lastEdited}
                </Text>
              </>
            ) : null}
          </Box>
        </Box>
        {awardsEl?.length && displayAward !== "large" ? (
          <Box ml={{ sx: "-0.5", md: 0 }}>
            <Wrap spacing="0">{awardsEl}</Wrap>
          </Box>
        ) : null}
      </Box>
      {awardsEl?.length && displayAward === "large" ? (
        <Box width="fit-content" mb="2" mt="4">
          <Wrap spacing="2">{awardsEl}</Wrap>
        </Box>
      ) : null}
    </Box>
  );
};
