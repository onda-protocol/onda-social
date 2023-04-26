import Link from "next/link";
import { Box, Text, Tooltip } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { IoChatbox } from "react-icons/io5";
import { GiJellyfish } from "react-icons/gi";
import { MouseEventHandler, forwardRef } from "react";

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
            likes: Number(Number(post.likes) + 1).toString(),
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
                  for (const index in posts) {
                    const p = posts[index];
                    if (p.id === post.id) {
                      const newPost = { ...p };
                      newPost.likes = Number(
                        Number(newPost.likes) + 1
                      ).toString();
                      return [
                        ...posts.slice(0, Number(index)),
                        newPost,
                        ...posts.slice(Number(index) + 1),
                      ];
                    }
                  }
                }
              }
            );
          });
      },
    }
  );

  return (
    <LikeButton
      label={post.likes.toString()}
      disabled={mutation.isLoading}
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
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export const PostButton = forwardRef<HTMLDivElement, PostButtonProps>(
  function PostButton({ label, icon, disabled, onClick }, ref) {
    return (
      <Box
        ref={ref}
        p="2"
        display="flex"
        alignItems="center"
        borderRadius="md"
        bgColor={disabled ? "whiteAlpha.50" : "whiteAlpha.100"}
        width="fit-content"
        userSelect="none"
        cursor={disabled ? "not-allowed" : "pointer"}
        _hover={{
          backgroundColor: disabled ? undefined : "whiteAlpha.300",
        }}
        _focus={{
          backgroundColor: disabled ? undefined : "whiteAlpha.200",
        }}
        onClick={onClick}
      >
        {icon ?? null}
        <Text as="span" fontSize="sm" color="gray.600" ml={icon ? "2" : "0"}>
          {label}
        </Text>
      </Box>
    );
  }
);

export const LikeButton: React.FC<Omit<PostButtonProps, "icon">> = (props) => (
  <Tooltip label="Feed 1 $PLNK" shouldWrapChildren>
    <PostButton icon={<GiJellyfish />} {...props} />
  </Tooltip>
);
