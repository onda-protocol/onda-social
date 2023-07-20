import Link from "next/link";
import { Box, Text, Tooltip } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSessionWallet } from "@gumhq/react-sdk";
import { IoChatbox, IoTrash } from "react-icons/io5";
import { GiSadCrab } from "react-icons/gi";
import { MouseEventHandler, forwardRef, use } from "react";
import toast from "react-hot-toast";

import { deleteEntry, getDataHash, likeEntry } from "lib/anchor";
import {
  PostWithCommentsCountAndForum,
  SerializedCommentNested,
} from "lib/api";
import { getOrCreateSession } from "lib/gum";
import { BLOOM_PROGRAM_ID } from "lib/anchor/constants";

interface PostButtonsProps {
  post: PostWithCommentsCountAndForum;
  displayDelete?: boolean;
  onDeleted?: () => void;
}

export const PostButtons = ({
  post,
  displayDelete,
  onDeleted,
}: PostButtonsProps) => {
  return (
    <Box display="flex" flexDirection="row" gap="2" mt="6">
      <Link href={`/comments/${post.id}`}>
        <PostButton
          icon={<IoChatbox />}
          label={`${post?._count?.Comments} comments`}
        />
      </Link>
      <PostLikeButton post={post} />
      {displayDelete && (
        <DeleteButton
          forumId={post.forum}
          entry={post}
          label="Delete"
          onDeleted={onDeleted}
        />
      )}
    </Box>
  );
};

interface PostLikeButtonProps {
  post: PostWithCommentsCountAndForum;
}

export const PostLikeButton = ({ post }: PostLikeButtonProps) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet()!;
  const queryClient = useQueryClient();
  const sessionWallet = useSessionWallet();
  const isAuthor = anchorWallet?.publicKey?.toBase58() === post.author;

  const mutation = useMutation(
    async () => {
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
      onError(err) {
        console.error(err);
        toast.error("Failed to send PLANK");
      },
    }
  );

  return (
    <LikeButton
      label={post.likes.toString()}
      disabled={isAuthor || mutation.isLoading}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
        return false;
      }}
    />
  );
};

interface PostDeleteButtonProps {
  forumId: string;
  entry: PostWithCommentsCountAndForum | SerializedCommentNested;
  label?: string;
  onDeleted?: () => void;
}

export const DeleteButton = ({
  forumId,
  entry,
  label,
  onDeleted,
}: PostDeleteButtonProps) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const mutation = useMutation(
    async () => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      const dataHash = getDataHash(connection, anchorWallet, entry);

      return deleteEntry(connection, anchorWallet, {
        forumId,
        dataHash,
        entryId: entry.id,
        createdAt: Number(entry.createdAt),
        editedAt: Number(entry.editedAt),
        nonce: Number(entry.nonce),
      });
    },
    {
      onError(err) {
        // @ts-ignore
        console.log(err.logs);
        toast.error("Failed to delete entry");
      },
      onSuccess() {
        toast.success("Entry deleted");
        if (onDeleted) {
          onDeleted();
        }
      },
    }
  );

  return (
    <PostButton
      icon={<IoTrash />}
      label={label}
      disabled={mutation.isLoading}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate();
      }}
    />
  );
};

interface PostButtonProps {
  label?: string;
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
        {label ? (
          <Text as="span" fontSize="sm" color="gray.600" ml={icon ? "2" : "0"}>
            {label}
          </Text>
        ) : null}
      </Box>
    );
  }
);

export const LikeButton: React.FC<Omit<PostButtonProps, "icon">> = (props) => (
  <Tooltip label="Reward PLANK" shouldWrapChildren>
    <PostButton icon={<GiSadCrab />} {...props} />
  </Tooltip>
);
