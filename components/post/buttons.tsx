import Link from "next/link";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { web3 } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  useQueryClient,
  useMutation,
  QueryClient,
} from "@tanstack/react-query";
import {
  IoChatbox,
  IoTrash,
  IoGift,
  IoArrowUp,
  IoArrowDown,
} from "react-icons/io5";
import { MouseEventHandler, forwardRef, useCallback } from "react";
import toast from "react-hot-toast";
import base58 from "bs58";

import {
  AwardsJson,
  PostWithCommentsCountAndForum,
  SerializedAward,
  getTransaction,
  vote,
} from "lib/api";
import { useAwardModal } from "components/modal";
import { useAuth } from "components/providers/auth";

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
      updatePostAwardsCache(queryClient, post.id, award);
    },
    [queryClient, post]
  );

  return (
    <Box display="flex" flexDirection="row" gap="2" mt="6">
      <PostPointsButton post={post} />
      <Link href={`/comments/${post.id}`}>
        <PostButton icon={<IoChatbox />} label={`${post?._count?.Comments}`} />
      </Link>
      <AwardButton entryId={post.id} onSuccess={handleCacheUpdate} />
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
    <PointsButton points={0} onUpvote={() => {}} onDownvote={() => {}} />
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

      const response = await getTransaction({
        method: "deleteEntry",
        data: {
          author: auth.address,
          forum: forumId,
          entryId,
          entryType,
        },
      });

      const transaction = web3.Transaction.from(
        base58.decode(response.transaction)
      );
      const payerSig = transaction.signatures.find((sig) =>
        transaction.feePayer?.equals(sig.publicKey)
      );

      if (!payerSig?.signature) {
        throw new Error("Payer signature not found");
      }

      const signedTransaction = await auth.signTransaction(transaction);
      signedTransaction.addSignature(payerSig.publicKey, payerSig.signature);

      const txId = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          preflightCommitment: "confirmed",
        }
      );

      const blockhash = await connection.getLatestBlockhash();
      const result = await connection.confirmTransaction(
        {
          signature: txId,
          ...blockhash,
        },
        "confirmed"
      );

      if (result.value.err) {
        throw new Error(result.value.err.toString());
      }
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

interface PostPointsButtonProps {
  post: PostWithCommentsCountAndForum;
}

export const PostPointsButton = ({ post }: PostPointsButtonProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    async (dir: "up" | "down") => {
      if (!auth.address) {
        throw new Error("Wallet not connected");
      }

      return vote(post.id, auth.address, "post", dir);
    },
    {
      onMutate(dir) {
        updatePostPointsCache(queryClient, post.id, dir);
      },
    }
  );

  return (
    <PointsButton
      points={Number(post.points)}
      onUpvote={() => mutation.mutate("up")}
      onDownvote={() => mutation.mutate("down")}
    />
  );
};

interface PointsButtonProps {
  points: number;
  onUpvote: () => void;
  onDownvote: () => void;
}

export const PointsButton = ({
  points,
  onUpvote,
  onDownvote,
}: PointsButtonProps) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      borderRadius="md"
      bgColor="whiteAlpha.100"
      width="fit-content"
      userSelect="none"
    >
      <Box
        as="button"
        aria-label="Upvote Button"
        p="2"
        borderRadius="md"
        _hover={{
          color: "green.500",
          backgroundColor: "whiteAlpha.300",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onUpvote();
          return false;
        }}
      >
        <IoArrowUp />
      </Box>
      <Text
        as="span"
        color="whiteAlpha.700"
        fontSize="sm"
        fontWeight="semibold"
      >
        {points}
      </Text>
      <Box
        as="button"
        aria-label="Downvote Button"
        p="2"
        borderRadius="md"
        _hover={{
          color: "red.500",
          backgroundColor: "whiteAlpha.300",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDownvote();
          return false;
        }}
      >
        <IoArrowDown />
      </Box>
    </Box>
  );
};

interface AwardButtonProps {
  entryId: string;
  disabled?: boolean;
  onSuccess: (award: SerializedAward) => void;
}

export const AwardButton = ({
  entryId,
  disabled,
  onSuccess,
}: AwardButtonProps) => {
  const modal = useAwardModal();

  return (
    <PostButton
      icon={<IoGift />}
      label="Award"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        modal.openModal(entryId, onSuccess);
        return false;
      }}
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
      queryClient.setQueryData<PostWithCommentsCountAndForum[]>(
        query.queryKey,
        (posts) => {
          if (posts) {
            for (const index in posts) {
              const p = posts[index];
              if (p.id === entryId) {
                const newPost = reducer(p);
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
      points: Number(Number(post.points) + 1).toString(),
    };
  });
}

function updatePostPointsCache(
  queryClient: QueryClient,
  entryId: string,
  dir: "up" | "down"
) {
  updatePostsCache(queryClient, entryId, (post) => {
    return {
      ...post,
      points: Number(Number(post.points) + (dir === "up" ? 1 : -1)).toString(),
    };
  });
}
