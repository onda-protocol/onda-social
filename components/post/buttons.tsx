import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  useQueryClient,
  useMutation,
  QueryClient,
} from "@tanstack/react-query";
import { IoChatbox, IoTrash } from "react-icons/io5";
import { GiSadCrab } from "react-icons/gi";
import { MouseEventHandler, forwardRef, useCallback } from "react";
import toast from "react-hot-toast";

import { deleteEntry, getDataHash } from "lib/anchor";
import {
  AwardsJson,
  PostWithCommentsCountAndForum,
  SerializedCommentNested,
  SerializedAward,
} from "lib/api";
import { useRewardModal } from "components/modal";

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
  const queryClient = useQueryClient();

  const handleCacheUpdate = useCallback(
    (award: SerializedAward) => {
      updatePostCache(queryClient, post.id, award);
    },
    [queryClient, post]
  );

  return (
    <Box display="flex" flexDirection="row" gap="2" mt="6">
      <Link href={`/comments/${post.id}`}>
        <PostButton
          icon={<IoChatbox />}
          label={`${post?._count?.Comments} comments`}
        />
      </Link>
      <RewardButton entryId={post.id} onSuccess={handleCacheUpdate} />
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

export const DummyPostButtons = () => (
  <Box display="flex" flexDirection="row" gap="2" mt="6">
    <PostButton icon={<IoChatbox />} label={`0 comments`} />
    <DummyRewardButton />
  </Box>
);

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

interface RewardButtonProps {
  entryId: string;
  disabled?: boolean;
  onSuccess: (award: SerializedAward) => void;
}

export const RewardButton = ({
  entryId,
  disabled,
  onSuccess,
}: RewardButtonProps) => {
  const rewardModal = useRewardModal();

  return (
    <PostButton
      icon={<GiSadCrab />}
      label="Reward"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        rewardModal.openModal(entryId, onSuccess);
        return false;
      }}
    />
  );
};

const DummyRewardButton = () => (
  <PostButton disabled icon={<GiSadCrab />} label="Reward" />
);

function incrementAward(awardJson: AwardsJson, award: SerializedAward) {
  const awards = awardJson ?? {};

  if (awards[award.id]) {
    awards[award.id].count = awards[award.id].count + 1;
  } else {
    awards[award.id] = {
      image: award.image,
      count: 1,
    };
  }

  return { ...awards };
}

function updatePostCache(
  queryClient: QueryClient,
  entryId: string,
  award: SerializedAward
) {
  queryClient.setQueryData<PostWithCommentsCountAndForum>(
    ["post", entryId],
    (data) => {
      if (data) {
        const rewards = incrementAward(data.rewards, award);

        return {
          ...data,
          rewards,
          points: Number(Number(data.points) + 1).toString(),
        };
      }
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
              if (p.id === entryId) {
                const rewards = incrementAward(p.rewards, award);
                const newPost = { ...p, rewards };
                newPost.points = Number(Number(newPost.points) + 1).toString();
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
}
