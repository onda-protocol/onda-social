import dynamic from "next/dynamic";
import { web3 } from "@project-serum/anchor";
import { Box, Button } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useMemo, useState } from "react";
import { IoChatbox } from "react-icons/io5";
import { BsArrowsExpand } from "react-icons/bs";

import type { EntryForm } from "../editor";
import {
  AwardsJson,
  SerializedAward,
  SerializedCommentNested,
  fetchReplies,
  fetchUser,
  vote,
} from "lib/api";
import { Markdown } from "../markdown";
import { PostMeta } from "../post/meta";
import {
  PostButton,
  AwardButton,
  DeleteButton,
  VoteButton,
} from "components/post/buttons";
import { useAuth } from "components/providers/auth";
import { VoteType } from "@prisma/client";

const Editor = dynamic(
  () => import("components/editor").then((mod) => mod.Editor),
  { ssr: false }
);

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

    const auth = useAuth();
    const queryClient = useQueryClient();
    const isAuthor = useMemo(
      () => Boolean(auth.address && auth.address === comment.author),
      [auth, comment.author]
    );

    const onReplyAdded = useCallback(
      async (_: string, uri: string, entry: EntryForm) => {
        if (!auth.address) return;

        const userAddress = auth.address;
        const author = await queryClient.fetchQuery(["user", userAddress], () =>
          fetchUser(userAddress)
        );

        const hasNestedChildren = "Children" in comment;
        const newComment: SerializedCommentNested = {
          uri,
          id: Math.random().toString(36),
          createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
          editedAt: null,
          parent: comment.id,
          post: comment.post,
          body: entry.body,
          nsfw: false,
          nonce: BigInt(0).toString(),
          points: BigInt(0).toString(),
          awards: {},
          hash: "",
          author: userAddress,
          Author: author,
          Votes: [],
          _vote: null,
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
      [comment, queryKey, auth, queryClient]
    );

    // Disable comment replies if parent is not a valid public key
    const disabled = useMemo(() => {
      if (typeof comment.id === "string") {
        try {
          new web3.PublicKey(comment.id);
          return false;
        } catch {
          return true;
        }
      }
      return false;
    }, [comment]);

    return (
      <Box position="relative" ml={isRoot ? "0" : "8"} mt="0">
        <Box p="4" pb="2">
          <PostMeta
            displayAvatar
            showRewards
            author={comment.Author}
            points={Number(comment.points)}
            awards={comment.awards as AwardsJson}
            createdAt={comment.createdAt}
            editedAt={comment.editedAt}
          />

          {!collapsed && (
            <Box pt="2" pl={`calc(28px + var(--chakra-space-2))`}>
              <Box pt="2">
                <Markdown>{comment.body}</Markdown>
              </Box>
              <Box display="flex" flexDirection="row" gap="2" pt="4" pb="2">
                <CommentVoteButton comment={comment} queryKey={queryKey} />
                <CommentAwardButton
                  disabled={disabled}
                  comment={comment}
                  queryKey={queryKey}
                />
                {!disableReplies && (
                  <PostButton
                    label="Reply"
                    disabled={disabled}
                    icon={<IoChatbox />}
                    onClick={toggleReply}
                  />
                )}
                {isAuthor && comment.body !== "[deleted]" && (
                  <CommentDeleteButton
                    disabled={disabled}
                    forumId={forum}
                    comment={comment}
                    queryKey={queryKey}
                  />
                )}
              </Box>
              {reply && disableReplies === false && (
                <Editor
                  buttonLabel="Reply"
                  placeholder={`Reply to ${
                    comment.Author?.name ?? comment.author
                  }`}
                  successMessage="Reply added"
                  config={{
                    type: "comment",
                    parent: comment.id,
                    post: comment.post,
                    forum,
                  }}
                  onRequestClose={() => setReply(false)}
                  onSuccess={onReplyAdded}
                />
              )}
            </Box>
          )}
        </Box>

        {comment._count?.Children > 0 && !collapsed ? (
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

interface CommentAwardButtonProps {
  disabled?: boolean;
  comment: SerializedCommentNested;
  queryKey: (string | { offset: number })[];
}

const CommentAwardButton: React.FC<CommentAwardButtonProps> = ({
  disabled,
  comment,
  queryKey,
}) => {
  const queryClient = useQueryClient();

  const handleCacheUpdate = useCallback(
    (award: SerializedAward) => {
      queryClient.setQueryData<Array<SerializedCommentNested>>(
        queryKey,
        nestedCommentsAwardsReducer(comment.id, award)
      );
    },
    [queryClient, comment, queryKey]
  );

  return (
    <AwardButton
      disabled={disabled}
      entryId={comment.id}
      onSuccess={handleCacheUpdate}
    />
  );
};

interface CommentVoteButtonProps {
  comment: SerializedCommentNested;
  queryKey: (string | { offset: number })[];
}

const CommentVoteButton = ({ comment }: CommentVoteButtonProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    async (voteType: VoteType) => {
      if (!auth.address) {
        throw new Error("Wallet not connected");
      }
      console.log(`Voting ${voteType} on ${comment._vote}`);
      return vote(comment.id, "comment", voteType);
    },
    {
      onMutate(voteType) {
        // updatePostVoteCache(queryClient, post.id, voteType);
      },
    }
  );
  return (
    <VoteButton
      points={Number(comment.points)}
      vote={comment._vote}
      onUpvote={() => mutation.mutate(VoteType.UP)}
      onDownvote={() => mutation.mutate(VoteType.DOWN)}
    />
  );
};

interface CommentDeleteButtonProps {
  disabled?: boolean;
  forumId: string;
  comment: SerializedCommentNested;
  queryKey: (string | { offset: number })[];
}

const CommentDeleteButton: React.FC<CommentDeleteButtonProps> = ({
  disabled,
  forumId,
  comment,
  queryKey,
}) => {
  const queryClient = useQueryClient();

  const onCommentDeleted = useCallback(() => {
    queryClient.setQueryData<Array<SerializedCommentNested>>(
      queryKey,
      nestedCommentsDeleteReducer(comment.id)
    );
  }, [queryClient, queryKey, comment]);

  return (
    <DeleteButton
      disabled={disabled}
      forumId={forumId}
      entryId={comment.id}
      entryType="comment"
      onDeleted={onCommentDeleted}
    />
  );
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
    borderColor="whiteAlpha.200"
    _hover={
      onClick
        ? {
            borderColor: "whiteAlpha.400",
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

function nestedCommentsAwardsReducer(
  id: string,
  award: SerializedAward
): (
  input: SerializedCommentNested[] | undefined
) => SerializedCommentNested[] | undefined {
  return nestedCommentsReducer(id, (comment) => ({
    ...comment,
    awards: incrementAward(comment.awards, award),
    points: increment(comment.points),
  }));
}

function nestedCommentsDeleteReducer(
  id: string
): (
  comments: SerializedCommentNested[] | undefined
) => SerializedCommentNested[] | undefined {
  return nestedCommentsReducer(id, (comment) => ({
    ...comment,
    body: "[deleted]",
    uri: "[deleted]",
    editedAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
  }));
}

function nestedCommentsReducer(
  id: string,
  updater: (comment: SerializedCommentNested) => SerializedCommentNested
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
          updater(comment),
          ...comments.slice(Number(index) + 1),
        ];
      } else if (comment.Children && comment.Children.length > 0) {
        const updatedChildren = nestedCommentsReducer(
          id,
          updater
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
