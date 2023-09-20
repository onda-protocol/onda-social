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
  <Box as="span" fontSize="xx-small" color="gray.500">
    &nbsp;•&nbsp;
  </Box>
);

const awardsArray = [
  {
    id: "0",
    image: "/glass.png",
    name: "Chewed Glass",
    description:
      "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
  },
  {
    id: "1",
    amount: 10_000_000,
    image: "/bottle.png",
    name: "Message in a Bottle",
    description:
      "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
  },
  {
    id: "2",
    amount: 10_000_000,
    image: "/plankton.png",
    name: "Plankton",
    description:
      "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
  },
  {
    id: "3",
    amount: 20_000_000,
    image: "/crab.png",
    name: "Crab",
    description:
      "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
  },
  {
    id: "4",
    amount: 30_000_000,
    image: "/glasseater-dark.png",
    name: "The Gigabrained Glass Eater",
    description:
      "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
  },
];

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
    if (awards || true) {
      // const awardsArray = Object.entries(awards);
      const awardSize = displayAward === "large" ? 28 : 18;

      return awardsArray.map((award) => (
        <WrapItem key={award.id}>
          <Tooltip label={award.name}>
            <Box
              display="flex"
              alignItems="center"
              width="fit-content"
              backgroundColor="prussianBlue"
              borderRadius="md"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              p="1"
              _hover={{
                borderColor: "whiteAlpha.400",
                "& .img-container": {
                  transform: "scale(1.2)",
                },
              }}
            >
              <Box className="img-container" transition="all 0.5 ease-out">
                <Image
                  unoptimized
                  alt="Award"
                  src={award.image}
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
                  1
                </Text>
              )}
            </Box>
          </Tooltip>
        </WrapItem>
      ));
    }

    return null;
  }, [awards]);

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
            <Text
              as="span"
              fontSize="sm"
              fontWeight="medium"
              color="whiteAlpha.800"
              _hover={{
                color: "whiteAlpha.600",
              }}
            >
              <Link href={`/o/${forumNamespace}`} onClick={handleClick}>
                <Box
                  as="span"
                  display="flex"
                  alignItems="center"
                  color="inherit"
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
                  <Text as="span" color="inherit">
                    <Text as="span" color="inherit" fontWeight="600">
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
              whiteSpace="nowrap"
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
                <Text
                  as="span"
                  fontWeight="bold"
                  fontSize="xs"
                  color="steelBlue"
                >
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
          </Text>
        </Box>
        {awardsEl && displayAward !== "large" && (
          <Box ml={{ sx: "-0.5", md: 0 }}>
            <Wrap spacing="1">{awardsEl}</Wrap>
          </Box>
        )}
      </Box>
      {awardsEl && displayAward === "large" && (
        <Box my="2">
          <Wrap spacing="2">{awardsEl}</Wrap>
        </Box>
      )}
    </Box>
  );
};
