import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { IoChatbox, IoFish } from "react-icons/io5";
import { MouseEventHandler } from "react";

import { likeEntry } from "lib/anchor";
import { PostWithCommentsCountAndForum } from "lib/api";

interface PostButtonsProps {
  post: PostWithCommentsCountAndForum;
}

export const PostButtons = ({ post }: PostButtonsProps) => {
  return (
    <Box display="flex" flexDirection="row" gap="2" mt="6">
      <Link href={`/comments/${post.id}`}>
        <PostButton
          icon={<IoChatbox />}
          label={`${post?._count?.Comments} comments`}
        />
      </Link>
      <PostLikeButton post={post} />
    </Box>
  );
};

interface PostLikeButtonProps {
  post: PostWithCommentsCountAndForum;
}

export const PostLikeButton = ({ post }: PostLikeButtonProps) => {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    () => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      return likeEntry(connection, anchorWallet, {
        id: post.id,
        author: post.author,
      });
    },
    {
      onSuccess() {
        queryClient.setQueryData<PostWithCommentsCountAndForum>(
          ["post", post.id],
          {
            ...post,
            likes: post.likes + 1,
          }
        );

        queryClient
          .getQueryCache()
          .findAll(["posts"], {
            exact: false,
          })
          .forEach((query) => {
            queryClient.setQueryData<PostWithCommentsCountAndForum[]>(
              query.queryKey,
              (posts) => {
                if (posts) {
                  posts.forEach((post) => {
                    if (post.id === post.id) {
                      post.likes = Number(Number(post.likes) + 1).toString();
                    }
                  });
                  return [...posts];
                }
              }
            );
          });
      },
    }
  );

  return (
    <PostButton
      icon={<IoFish />}
      label={post.likes.toString()}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
        return false;
      }}
    />
  );
};

interface PostButtonProps {
  label: string;
  icon?: JSX.Element;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const PostButton = ({ label, icon, onClick }: PostButtonProps) => {
  return (
    <Box
      p="2"
      display="flex"
      alignItems="center"
      borderRadius="md"
      bgColor="whiteAlpha.50"
      width="fit-content"
      userSelect="none"
      _hover={{
        backgroundColor: "whiteAlpha.100",
      }}
      _focus={{
        backgroundColor: "whiteAlpha.200",
      }}
      onClick={onClick}
    >
      {icon ?? null}
      <Text as="span" fontSize="xs" color="gray.600" ml={icon ? "2" : "0"}>
        {label}
      </Text>
    </Box>
  );
};
