import { Box, Button } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useMemo, useState } from "react";
import { IoChatbox, IoFish } from "react-icons/io5";

import {
  SerializedCommentNested,
  SerializedComment,
  fetchReplies,
} from "lib/api";
import { likeEntry } from "lib/anchor";
import { Markdown } from "../markdown";
import { Editor } from "../editor";
import { PostMeta } from "../post/meta";

interface CommentListItemProps {
  forum: string;
  comment: SerializedCommentNested;
  depth?: number;
  queryKey: string[];
}

export const CommentListItem: React.FC<CommentListItemProps> = ({
  forum,
  comment,
  depth = 0,
  queryKey,
}) => {
  const [reply, setReply] = useState(false);
  const toggleReply = useCallback(() => setReply((reply) => !reply), []);

  return (
    <Box position="relative" ml={depth ? "12" : undefined}>
      <Box position="relative" zIndex={1}>
        <Box
          borderWidth="1px"
          borderColor="gray.800"
          borderRadius="md"
          backgroundColor="#090A20"
          mt="4"
        >
          <Box p="4">
            <PostMeta author={comment.author} createdAt={comment.createdAt} />
            <Box pt="2">
              <Markdown>{comment.body}</Markdown>
            </Box>
          </Box>
          <Box pb="2" pl="2">
            <Button
              mr="2"
              size="xs"
              leftIcon={<IoChatbox />}
              onClick={toggleReply}
            >
              {comment._count.Children}
            </Button>
            <CommentLikeButton comment={comment} queryKey={queryKey} />
          </Box>
        </Box>
        {reply && (
          <Editor
            buttonLabel="Reply"
            placeholder={`Reply to ${comment.author}`}
            queryKey={queryKey}
            config={{
              type: "comment",
              parent: comment.id,
              post: comment.post,
              forum,
            }}
          />
        )}
      </Box>
      {comment._count.Children ? (
        <CommentReplies
          depth={depth + 1}
          forum={forum}
          comment={comment}
          queryKey={queryKey}
        />
      ) : null}
    </Box>
  );
};

interface CommentLikeButtonProps {
  comment: SerializedComment | SerializedCommentNested;
  queryKey: string[];
}

const CommentLikeButton: React.FC<CommentLikeButtonProps> = ({
  comment,
  queryKey,
}) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    () => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      return likeEntry(connection, anchorWallet, {
        id: comment.id,
        author: comment.author,
      });
    },
    {
      onSuccess() {
        queryClient.setQueryData<Array<SerializedCommentNested>>(
          queryKey,
          nestedCommentsLikeReducer<SerializedCommentNested>(comment.id)
        );
      },
    }
  );

  return (
    <Button
      size="xs"
      leftIcon={<IoFish />}
      isDisabled={mutation.isLoading}
      onClick={() => mutation.mutate()}
    >
      {comment.likes}
    </Button>
  );
};

interface CommentRepliesProps {
  depth: number;
  forum: string;
  comment: SerializedCommentNested;
  queryKey: string[];
}

const CommentReplies: React.FC<CommentRepliesProps> = ({
  depth,
  forum,
  comment,
  queryKey,
}) => {
  return (
    <Box>
      {comment.Children ? (
        <>
          <Branch />
          {comment.Children?.map((comment) => (
            <CommentListItem
              key={comment.id}
              depth={depth + 1}
              forum={forum}
              comment={comment}
              queryKey={queryKey}
            />
          ))}
        </>
      ) : (
        <CommentRepliesLazy depth={depth + 1} forum={forum} comment={comment} />
      )}
    </Box>
  );
};

interface CommentRepliesLazyProps {
  depth: number;
  forum: string;
  comment: SerializedComment;
}

const CommentRepliesLazy = ({
  depth,
  forum,
  comment,
}: CommentRepliesLazyProps) => {
  const [loadMore, setLoadMore] = useState(false);
  const queryKey = useMemo(() => ["replies", comment.id], [comment.id]);
  const query = useQuery(
    queryKey,
    () => fetchReplies(comment.post, comment.id),
    { enabled: !loadMore }
  );

  if (!loadMore || query.isLoading) {
    return (
      <>
        <Branch dashed />
        <Box pl={(depth * 2).toString()} pt="4" mb="2">
          <Button size="sm" variant="ghost" onClick={() => setLoadMore(true)}>
            {query.isLoading
              ? "Loading..."
              : `${comment._count.Children} more replies`}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      {query.data?.map((comment) => (
        <CommentListItem
          key={comment.id}
          depth={depth + 1}
          forum={forum}
          comment={comment}
          queryKey={queryKey}
        />
      ))}
    </>
  );
};

interface BranchProps {
  dashed?: boolean;
}

const Branch = ({ dashed }: BranchProps) => (
  <Box
    position="absolute"
    top="0"
    left="4"
    borderLeftWidth="2px"
    borderColor="gray.800"
    borderStyle={dashed ? "dashed" : "solid"}
    height={dashed ? "100%" : "calc(100% + var(--chakra-space-4))"}
  />
);

function increment(like: string) {
  return Number(Number(like) + 1).toString();
}

function nestedCommentsLikeReducer<
  T extends SerializedComment | SerializedCommentNested
>(id: string): (input: T[] | undefined) => T[] | undefined {
  return (comments) => {
    if (!comments) {
      return;
    }

    for (const index in comments) {
      const comment = comments[index];

      if (comment.id === id) {
        return [
          ...comments.slice(0, Number(index)),
          {
            ...comment,
            likes: increment(comment.likes),
          },
          ...comments.slice(Number(index) + 1),
        ];
      } else if ("Children" in comment && comment.Children) {
        const updatedChildren = nestedCommentsLikeReducer<SerializedComment>(
          comment.id
        )(comment.Children);

        if (updatedChildren) {
          return [
            ...comments.slice(0, Number(index)),
            {
              ...comments[index],
              Children: updatedChildren,
            },
            ...comments.slice(Number(index) + 1),
          ];
        }
      }
    }

    return comments;
  };
}
