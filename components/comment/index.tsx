import { Box, Button } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { memo, useCallback, useMemo, useState } from "react";
import { IoChatbox } from "react-icons/io5";
import { BsArrowsExpand } from "react-icons/bs";

import { SerializedCommentNested, fetchReplies, fetchUser } from "lib/api";
import { likeEntry } from "lib/anchor";
import { Markdown } from "../markdown";
import { Editor } from "../editor";
import { PostMeta } from "../post/meta";
import { PostButton, LikeButton, DeleteButton } from "components/post/buttons";

interface CommentListItemProps {
  forum: string;
  comment: SerializedCommentNested;
  depth?: number;
  queryKey: (string | { offset: number })[];
  isRoot?: boolean;
  disableReplies?: boolean;
}

export const CommentListItem: React.FC<CommentListItemProps> = memo(
  function CommentListItem({
    forum,
    comment,
    queryKey,
    isRoot = false,
    disableReplies = false,
  }) {
    const [reply, setReply] = useState(false);
    const toggleReply = useCallback(() => setReply((reply) => !reply), []);
    const [collapsed, setCollapsed] = useState(false);

    const anchorWallet = useAnchorWallet();
    const queryClient = useQueryClient();
    const isAuthor = useMemo(
      () => anchorWallet?.publicKey.toBase58() === comment.author,
      [anchorWallet, comment.author]
    );

    const onUpdateCache = useCallback(
      async (entryId: string, nonce: string, body: string, uri: string) => {
        if (anchorWallet === undefined) return;

        const userAddress = anchorWallet.publicKey.toBase58();
        const author = await queryClient.fetchQuery(["user", userAddress], () =>
          fetchUser(userAddress)
        );

        const hasNestedChildren = "Children" in comment;
        const newComment = {
          id: entryId,
          createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
          editedAt: null,
          parent: comment.id,
          post: comment.post,
          body: body,
          uri: uri,
          likes: "0",
          nonce: nonce,
          hash: "",
          author: userAddress,
          Author: author,
          _count: { Children: 0 },
          Children: [],
        };

        queryClient.setQueryData<SerializedCommentNested[]>(
          queryKey,
          (data) => {
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
                  updatedComment.Children = [newComment, ...(c.Children ?? [])];
                }
                return [
                  ...data.slice(0, parseInt(index)),
                  updatedComment,
                  ...data.slice(parseInt(index) + 1),
                ];
              } else if (c.Children !== undefined) {
                for (const i in c.Children) {
                  const child = c.Children[parseInt(i)];

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

                    if ("Children" in updatedChild) {
                      updatedChild.Children = [
                        newComment,
                        ...(updatedChild.Children ?? []),
                      ];
                    }

                    updatedComment.Children = [
                      ...c.Children.slice(0, parseInt(i)),
                      updatedChild,
                      ...c.Children.slice(parseInt(i) + 1),
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
          }
        );

        if (!hasNestedChildren) {
          queryClient.setQueryData<SerializedCommentNested[]>(
            ["replies", comment.id],
            (data) => {
              return [newComment, ...(data ?? [])];
            }
          );
        }
      },
      [comment, queryKey, anchorWallet, queryClient]
    );

    return (
      <Box position="relative" ml={isRoot ? "0" : "8"} mt="0">
        <Box p="4" pb="2">
          <PostMeta
            displayAvatar
            author={comment.Author}
            createdAt={comment.createdAt}
            editedAt={comment.editedAt}
          />

          {!collapsed && (
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
                {isAuthor && comment.body !== "[deleted]" && (
                  <CommentDeleteButton forumId={forum} comment={comment} />
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
          )}
        </Box>

        {comment._count.Children > 0 && !collapsed ? (
          <CommentReplies forum={forum} comment={comment} queryKey={queryKey} />
        ) : null}

        {collapsed ? (
          <Box
            ml="6"
            mt="1"
            color="gray.600"
            cursor="pointer"
            _hover={{
              color: "gray.500",
            }}
            onClick={() => setCollapsed(false)}
          >
            <BsArrowsExpand />
          </Box>
        ) : (
          <Branch onClick={() => setCollapsed(true)} />
        )}
      </Box>
    );
  }
);

interface CommentLikeButtonProps {
  comment: SerializedCommentNested;
  queryKey: (string | { offset: number })[];
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
          nestedCommentsLikeReducer(comment.id)
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

interface CommentDeleteButtonProps {
  forumId: string;
  comment: SerializedCommentNested;
}

const CommentDeleteButton: React.FC<CommentDeleteButtonProps> = ({
  forumId,
  comment,
}) => {
  return <DeleteButton forumId={forumId} entry={comment} />;
};

interface CommentRepliesProps {
  forum: string;
  comment: SerializedCommentNested;
  queryKey: (string | { offset: number })[];
}

const CommentReplies: React.FC<CommentRepliesProps> = ({
  forum,
  comment,
  queryKey,
}) => {
  return (
    <>
      {comment.Children ? (
        <>
          {comment.Children.map((comment: SerializedCommentNested) => (
            <CommentListItem
              key={comment.id}
              forum={forum}
              comment={comment}
              queryKey={queryKey}
            />
          ))}
          {comment._count.Children > comment.Children.length && (
            <CommentSiblingsLazy
              comment={comment}
              forum={forum}
              offset={comment.Children.length}
            />
          )}
        </>
      ) : (
        <CommentChildrenLazy forum={forum} comment={comment} />
      )}
    </>
  );
};

interface CommentChildrenLazyProps {
  forum: string;
  comment: SerializedCommentNested;
}

const CommentChildrenLazy = ({ forum, comment }: CommentChildrenLazyProps) => {
  const [loadMore, setLoadMore] = useState(false);
  const queryKey = useMemo(() => ["replies", comment.id], [comment.id]);
  const query = useQuery(
    queryKey,
    () => fetchReplies(comment.post, comment.id),
    { enabled: loadMore }
  );

  if (query.data === undefined || query.data.length === 0) {
    return (
      <MoreRepliesButton
        nested
        count={comment._count.Children}
        loading={query.isFetching}
        onClick={() => (loadMore ? query.refetch() : setLoadMore(true))}
      />
    );
  }

  return (
    <>
      {query.data.map((comment) => (
        <CommentListItem
          key={comment.id}
          forum={forum}
          comment={comment}
          queryKey={queryKey}
        />
      ))}
    </>
  );
};

interface CommentSiblingsLazyProps {
  comment: SerializedCommentNested;
  forum: string;
  offset: number;
}

const CommentSiblingsLazy = ({
  comment,
  forum,
  offset,
}: CommentSiblingsLazyProps) => {
  const [loadMore, setLoadMore] = useState(false);
  const queryKey = useMemo(
    () => ["replies", comment.parent as string, { offset }],
    [comment.parent, offset]
  );
  const query = useQuery(
    queryKey,
    () => fetchReplies(comment.post, comment.id, offset),
    { enabled: loadMore }
  );

  if (query.data === undefined || query.data.length === 0) {
    return (
      <MoreRepliesButton
        count={comment._count.Children - offset}
        loading={query.isFetching}
        onClick={() => (loadMore ? query.refetch() : setLoadMore(true))}
      />
    );
  }

  return (
    <>
      {query.data.map((comment) => (
        <CommentListItem
          key={comment.id}
          forum={forum}
          comment={comment}
          queryKey={queryKey}
        />
      ))}
    </>
  );
};

interface MoreRepliesButton {
  nested?: boolean;
  count: number;
  loading: boolean;
  onClick: () => void;
}

const MoreRepliesButton: React.FC<MoreRepliesButton> = ({
  nested = false,
  count,
  loading,
  onClick,
}) => (
  <Box position="relative" ml="8" pt="2" pb="2" bgColor="onda.950" zIndex={1}>
    <Box ml={nested ? "4" : "12"}>
      <Button size="sm" variant="ghost" fontWeight="semibold" onClick={onClick}>
        {loading
          ? "Loading..."
          : `${count} more repl${count > 1 ? "ies" : "y"}`}
      </Button>
    </Box>
    {nested ? null : <Branch dashed />}
  </Box>
);

interface BranchProps {
  dashed?: boolean;
  onClick?: () => void;
}

const Branch = ({ dashed, onClick }: BranchProps) => (
  <Box
    as="span"
    position="absolute"
    top={dashed ? "0" : "14"}
    left={"calc(var(--chakra-space-8) - 5px)"}
    bottom={dashed ? "-2" : "-2"}
    width="10px"
    px="4px"
    zIndex={1}
    cursor={onClick ? "pointer" : "default"}
    borderColor="gray.800"
    _hover={
      onClick
        ? {
            borderColor: "gray.600",
          }
        : undefined
    }
    onClick={onClick}
  >
    <Box
      as="span"
      display="block"
      height="100%"
      width="2px"
      borderLeftWidth="2px"
      borderColor="inherit"
      borderStyle={dashed ? "dashed" : "solid"}
    />
  </Box>
);

function increment(like: string) {
  return Number(Number(like) + 1).toString();
}

function nestedCommentsLikeReducer(
  id: string
): (
  input: SerializedCommentNested[] | undefined
) => SerializedCommentNested[] | undefined {
  return (comments) => {
    if (!comments) {
      return;
    }

    for (const index in comments) {
      const comment: SerializedCommentNested = comments[index];

      if (comment.id === id) {
        return [
          ...comments.slice(0, Number(index)),
          {
            ...comment,
            likes: increment(comment.likes),
          },
          ...comments.slice(Number(index) + 1),
        ];
      } else if (comment.Children) {
        const updatedChildren = nestedCommentsLikeReducer(id)(comment.Children);

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
