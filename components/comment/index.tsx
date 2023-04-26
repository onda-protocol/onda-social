import { Box, Button } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useMemo, useState } from "react";
import { IoChatbox } from "react-icons/io5";

import {
  SerializedCommentNested,
  SerializedComment,
  fetchReplies,
  fetchUser,
} from "lib/api";
import { likeEntry } from "lib/anchor";
import { Markdown } from "../markdown";
import { Editor } from "../editor";
import { PostMeta } from "../post/meta";
import { PostButton, LikeButton } from "components/post/buttons";

interface CommentListItemProps {
  forum: string;
  comment: SerializedCommentNested;
  depth?: number;
  queryKey: string[];
  disableReplies?: boolean;
}

export const CommentListItem: React.FC<CommentListItemProps> = ({
  forum,
  comment,
  depth = 0,
  queryKey,
  disableReplies = false,
}) => {
  const [reply, setReply] = useState(false);
  const toggleReply = useCallback(() => setReply((reply) => !reply), []);

  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const onUpdateCache = useCallback(
    async (entryId: string, nonce: string, body: string) => {
      if (anchorWallet === undefined) return;

      const userAddress = anchorWallet.publicKey.toBase58();
      const author = await queryClient.fetchQuery(["user", userAddress], () =>
        fetchUser(userAddress)
      );

      const hasNestedChildren = comment.Children !== undefined;
      queryClient.setQueryData<SerializedCommentNested[]>(queryKey, (data) => {
        // If the comment has a nested comment i.e. SerializedCommentNested
        // then we need to update the comment's children
        for (const index in data) {
          const c = data[parseInt(index)];
          if (comment.id === c.id) {
            const updatedComment = {
              ...c,
              _count: {
                ...c._count,
                Children: c._count.Children + 1,
              },
            };

            if (c.Children !== undefined) {
              updatedComment.Children = [
                {
                  id: entryId,
                  createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
                  editedAt: null,
                  parent: comment.id,
                  post: comment.post,
                  body: body,
                  likes: "0",
                  nonce: nonce,
                  author: userAddress,
                  Author: author,
                  _count: { Children: 0 },
                } as SerializedComment,
                ...(c.Children ?? []),
              ];
            }
            return [
              ...data.slice(0, parseInt(index)),
              updatedComment,
              ...data.slice(parseInt(index) + 1),
            ];
          } else if (c.Children !== undefined) {
            for (const index in c.Children) {
              const child = c.Children[parseInt(index)];
              if (child.id === comment.id) {
                const updatedComment = {
                  ...c,
                };
                const updatedChild = {
                  ...child,
                  _count: {
                    ...child._count,
                    Children: child._count.Children + 1,
                  },
                };

                updatedComment.Children = [
                  ...c.Children.slice(0, parseInt(index)),
                  updatedChild,
                  ...c.Children.slice(parseInt(index) + 1),
                ];

                return [
                  ...data.slice(0, parseInt(index)),
                  updatedComment,
                  ...data.slice(parseInt(index) + 1),
                ];
              }
            }
          }
        }
      });

      if (!hasNestedChildren) {
        queryClient.setQueryData<SerializedCommentNested[]>(
          ["replies", comment.id],
          (data) => {
            const newComment = {
              id: entryId,
              createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
              editedAt: null,
              parent: comment.parent,
              post: comment.post,
              body: body,
              likes: "0",
              nonce: nonce,
              author: userAddress,
              Author: author,
              Children: [],
              _count: { Children: 0 },
            } as SerializedCommentNested;

            return [newComment, ...(data ?? [])];
          }
        );
      }
    },
    [comment, queryKey, anchorWallet, queryClient]
  );

  return (
    <Box
      position="relative"
      ml={depth ? "12" : undefined}
      _last={{ overflow: "hidden" }}
    >
      <Box borderRadius="md" mt="4">
        <Box p="4">
          <PostMeta
            displayAvatar
            author={comment.Author}
            createdAt={comment.createdAt}
          />
          <Box pt="2" pl={`calc(28px + var(--chakra-space-2))`}>
            <Markdown>{comment.body}</Markdown>
            <Box display="flex" flexDirection="row" gap="2" pt="4" pb="2">
              <CommentLikeButton comment={comment} queryKey={queryKey} />
              {!disableReplies && (
                <PostButton
                  label="Reply"
                  icon={<IoChatbox />}
                  onClick={toggleReply}
                />
              )}
            </Box>
            {reply && disableReplies === false && (
              <Editor
                buttonLabel="Reply"
                placeholder={`Reply to ${
                  comment.Author.name ?? comment.author
                }`}
                config={{
                  type: "comment",
                  parent: comment.id,
                  post: comment.post,
                  forum,
                }}
                onRequestClose={() => setReply(false)}
                onUpdate={onUpdateCache}
              />
            )}
          </Box>
        </Box>
      </Box>

      {comment._count.Children ? (
        <CommentReplies
          depth={depth + 1}
          forum={forum}
          comment={comment}
          queryKey={queryKey}
        />
      ) : (
        <Branch />
      )}
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
    <LikeButton
      label={comment.likes}
      disabled={mutation.isLoading}
      onClick={() => mutation.mutate()}
    />
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
    <>
      {comment.Children ? (
        <>
          {comment.Children?.map((comment) => (
            <CommentListItem
              key={comment.id}
              depth={depth + 1}
              forum={forum}
              comment={comment}
              queryKey={queryKey}
            />
          ))}
          <Branch />
        </>
      ) : (
        <CommentRepliesLazy depth={depth + 1} forum={forum} comment={comment} />
      )}
    </>
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
    { enabled: loadMore }
  );

  if (query.data === undefined || query.data.length === 0) {
    return (
      <>
        <Branch dashed />
        <Box pl={(depth * 2).toString()} pt="4" mb="2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => (loadMore ? query.refetch() : setLoadMore(true))}
          >
            {query.isFetching
              ? "Loading..."
              : `${comment._count.Children} more replies`}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Branch />
      {query.data.map((comment) => (
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
    as="span"
    position="absolute"
    top="12"
    left={"calc(var(--chakra-space-8) - 1px)"}
    mr="1px"
    bottom="-8"
    borderWidth="1px"
    borderColor="gray.800"
    borderStyle={dashed ? "dashed" : "solid"}
    zIndex={-1}
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
