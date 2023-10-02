import Link from "next/link";
import { Box, Text } from "@chakra-ui/react";
import { VoteType } from "@prisma/client";
import { web3 } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  useQueryClient,
  useMutation,
  QueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { IoChatbox, IoTrash, IoGift } from "react-icons/io5";
import { MouseEventHandler, forwardRef, useCallback } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import base58 from "bs58";

import {
  AwardsJson,
  PostWithCommentsCountAndForum,
  SerializedAward,
  signAndConfirmTransaction,
  vote,
} from "lib/api";
import { useAwardModal } from "components/modal";
import { useAuth } from "components/providers/auth";

interface PostButtonsProps {
  post: PostWithCommentsCountAndForum;
  displayDelete?: boolean;
  displayVote?: boolean;
  onDeleted?: () => void;
}

export const PostButtons = ({
  post,
  displayDelete,
  displayVote,
  onDeleted,
}: PostButtonsProps) => {
  const queryClient = useQueryClient();

  const handleCacheUpdate = useCallback(
    (award: SerializedAward) => {
      updatePostAwardsCache(queryClient, post.id, award);
    },
    [queryClient, post]
  );

  return (
    <Box display="flex" flexDirection="row" gap="2" mt="6">
      {displayVote && <PostVoteButtons post={post} direction="row" />}
      <Link href={`/comments/${post.id}`}>
        <PostButton icon={<IoChatbox />} label={`${post?._count?.Comments}`} />
      </Link>
      <AwardButton
        label="Award"
        forum={post.forum}
        entryId={post.id}
        author={post.Author.id}
        createdAt={Number(post.createdAt)}
        editedAt={post.editedAt ? Number(post.editedAt) : null}
        dataHash={post.dataHash!}
        nonce={Number(post.nonce)}
        onSuccess={handleCacheUpdate}
      />
      {displayDelete && (
        <DeleteButton
          forumId={post.forum}
          entryId={post.id}
          entryType="post"
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
  disabled?: boolean;
  forumId: string;
  entryId: string;
  entryType: "post" | "comment";
  label?: string;
  onDeleted?: () => void;
}

export const DeleteButton = ({
  disabled,
  forumId,
  entryId,
  entryType,
  label,
  onDeleted,
}: PostDeleteButtonProps) => {
  const { connection } = useConnection();
  const auth = useAuth();

  const mutation = useMutation(
    async () => {
      if (!auth.address) {
        throw new Error("Wallet not connected");
      }

      if (!auth.signTransaction) {
        throw new Error("Wallet not connected");
      }

      await signAndConfirmTransaction(connection, auth, {
        method: "deleteEntry",
        data: {
          author: auth.address,
          forum: forumId,
          entryId,
          entryType,
        },
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
      disabled={disabled || mutation.isLoading}
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
        onClick={disabled ? undefined : onClick}
      >
        {icon ?? null}
        {label ? (
          <Text
            as="span"
            color="whiteAlpha.700"
            fontSize="sm"
            fontWeight="semibold"
            ml={icon ? "2" : "0"}
          >
            {label}
          </Text>
        ) : null}
      </Box>
    );
  }
);

interface PostVoteButtonsProps {
  direction?: "row" | "column";
  post: PostWithCommentsCountAndForum;
}

export const PostVoteButtons = ({ direction, post }: PostVoteButtonsProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    async (voteType: VoteType) => {
      if (!auth.address) {
        throw new Error("Wallet not connected");
      }
      console.log(`Voting ${voteType} on ${post._vote}`);
      return vote(post.id, "post", voteType);
    },
    {
      onMutate(voteType) {
        let count = post._vote ? 2 : 1;
        updatePostVoteCache(queryClient, post.id, voteType, count);
      },
    }
  );

  const mutate = mutation.mutate;

  const handleUpvote = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      mutate(VoteType.UP);
      return false;
    },
    [mutate]
  );

  const handleDownvote = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      mutate(VoteType.DOWN);
      return false;
    },
    [mutate]
  );

  return (
    <VoteButtons
      disabled={!auth.address}
      direction={direction}
      points={Number(post.points)}
      vote={post._vote}
      onUpvote={handleUpvote}
      onDownvote={handleDownvote}
    />
  );
};

interface VoteButtonsProps {
  direction?: "row" | "column";
  points: number;
  vote: VoteType | null;
  disabled?: boolean;
  onUpvote: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => false | void;
  onDownvote: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => false | void;
}

export const VoteButtons = ({
  direction = "column",
  points,
  vote,
  disabled,
  onUpvote,
  onDownvote,
}: VoteButtonsProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      return false;
    },
    []
  );

  return (
    <Box
      display="flex"
      flexDirection={direction}
      alignItems="center"
      borderRadius="md"
      width="fit-content"
      userSelect="none"
      bgColor={direction === "row" ? "whiteAlpha.100" : undefined}
      onClick={handleClick}
    >
      <UpVoteButton
        disabled={disabled}
        active={vote === VoteType.UP}
        onClick={onUpvote}
      />
      <Text as="span" color="whiteAlpha.700" fontSize="sm" fontWeight="bold">
        {points}
      </Text>
      <DownVoteButton
        disabled={disabled}
        active={vote === VoteType.DOWN}
        onClick={onDownvote}
      />
    </Box>
  );
};

interface VoteButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export const UpVoteButton = ({
  active,
  disabled,
  onClick,
}: VoteButtonProps) => (
  <Box
    as="button"
    aria-label="Upvote Button"
    p="2"
    borderRadius="md"
    fontSize="lg"
    _hover={{
      color: "steelBlue",
      backgroundColor: "whiteAlpha.300",
    }}
    onClick={active || disabled ? undefined : onClick}
  >
    <motion.svg
      initial={false}
      animate={{
        color: active ? "#3182CE" : "#E2E8F0",
        scale: active ? [0.8, 1.2, 1] : 1,
      }}
      transition={{
        ease: "easeInOut",
        duration: 0.3,
      }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      height="1em"
      width="1em"
    >
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="48"
        d="M112 244l144-144 144 144M256 120v292"
      />
    </motion.svg>
  </Box>
);

interface DownVoteButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export const DownVoteButton = ({
  active,
  disabled,
  onClick,
}: DownVoteButtonProps) => (
  <Box
    as="button"
    aria-label="Upvote Button"
    disabled={active}
    p="2"
    borderRadius="md"
    fontSize="lg"
    color={active ? "pumpkin" : "whiteAlpha.700"}
    _hover={{
      color: "pumpkin",
      backgroundColor: "whiteAlpha.300",
    }}
    onClick={active || disabled ? undefined : onClick}
  >
    <motion.svg
      initial={false}
      animate={{
        color: active ? "#3182CE" : "#E2E8F0",
        scale: active ? [0.8, 1.2, 1] : 1,
      }}
      transition={{
        ease: "easeInOut",
        duration: 0.3,
      }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      height="1em"
      width="1em"
      strike-width="0"
    >
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="48"
        d="M112 268l144 144 144-144M256 392V100"
      />
    </motion.svg>
  </Box>
);

interface AwardButtonProps {
  label?: string;
  entryId: string;
  author: string;
  forum: string;
  createdAt: number;
  editedAt: number | null;
  dataHash: string;
  nonce: number;
  disabled?: boolean;
  onSuccess: (award: SerializedAward) => void;
}

export const AwardButton = ({
  label,
  entryId,
  author,
  forum,
  createdAt,
  editedAt,
  dataHash,
  nonce,
  disabled,
  onSuccess,
}: AwardButtonProps) => {
  const modal = useAwardModal();

  const handleAward = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      modal.openModal({
        entryId,
        author,
        forum,
        createdAt,
        editedAt,
        dataHash,
        nonce,
        callback: onSuccess,
      });
      return false;
    },
    [
      entryId,
      author,
      forum,
      createdAt,
      editedAt,
      dataHash,
      nonce,
      onSuccess,
      modal,
    ]
  );

  return (
    <PostButton
      icon={<IoGift />}
      label={label}
      disabled={disabled}
      onClick={handleAward}
    />
  );
};

const DummyRewardButton = () => (
  <PostButton disabled icon={<IoGift />} label="Reward" />
);

function incrementAward(awardJson: AwardsJson, award: SerializedAward) {
  const awards = awardJson ?? {};

  if (awards[award.id]) {
    awards[award.id].count = awards[award.id].count + 1;
  } else {
    awards[award.id] = {
      name: award.name,
      image: award.image,
      count: 1,
    };
  }

  return { ...awards };
}

function updatePostsCache(
  queryClient: QueryClient,
  entryId: string,
  reducer: (p: PostWithCommentsCountAndForum) => PostWithCommentsCountAndForum
) {
  queryClient.setQueryData<PostWithCommentsCountAndForum>(
    ["post", entryId],
    (data) => {
      if (data) {
        return reducer(data);
      }
    }
  );

  queryClient
    .getQueryCache()
    .findAll(["posts"], {
      exact: false,
    })
    .forEach((query) => {
      queryClient.setQueryData<InfiniteData<PostWithCommentsCountAndForum[]>>(
        query.queryKey,
        (data) => {
          if (!data) return;

          for (const page in data.pages) {
            const posts = data.pages[page];

            for (const index in posts) {
              const p = posts[index];

              if (p.id === entryId) {
                const newPost = reducer(p);

                return {
                  ...data,
                  pages: [
                    ...data.pages.slice(0, Number(page)),
                    [
                      ...posts.slice(0, Number(index)),
                      newPost,
                      ...posts.slice(Number(index) + 1),
                    ],
                    ...data.pages.slice(Number(page) + 1),
                  ],
                };
              }
            }
          }
        }
      );
    });
}

function updatePostAwardsCache(
  queryClient: QueryClient,
  entryId: string,
  award: SerializedAward
) {
  updatePostsCache(queryClient, entryId, (post) => {
    const awards = incrementAward(post.awards, award);
    return {
      ...post,
      awards,
    };
  });
}

function updatePostVoteCache(
  queryClient: QueryClient,
  entryId: string,
  voteType: VoteType,
  count: number
) {
  updatePostsCache(queryClient, entryId, (post) => {
    return {
      ...post,
      points: Number(
        Number(post.points) + (voteType === VoteType.UP ? count : -count)
      ).toString(),
      _vote: voteType,
    };
  });
}
