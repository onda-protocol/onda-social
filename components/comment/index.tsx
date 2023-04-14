import { Box, Button, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { IoChatbox, IoHeart } from "react-icons/io5";

import {
  SerializedCommentNested,
  SerializedComment,
  fetchReplies,
} from "lib/api";
import { Markdown } from "../markdown";
import { Editor } from "../editor";
import { PostMeta } from "../post/meta";

interface CommentListItemProps {
  forum: string;
  comment: SerializedCommentNested;
  depth?: number;
}

export const CommentListItem = ({
  forum,
  comment,
  depth = 0,
}: CommentListItemProps) => {
  console.log(comment);
  const [reply, setReply] = useState(false);
  const toggleReply = useCallback(() => setReply((reply) => !reply), []);
  const queryKey = useMemo(() => ["comments", comment.post], [comment.post]);

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
            <Button size="xs" leftIcon={<IoHeart />} onClick={() => {}}>
              {comment.likes}
            </Button>
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
        <CommentReplies depth={depth + 1} forum={forum} comment={comment} />
      ) : null}
    </Box>
  );
};

interface CommentRepliesProps {
  depth: number;
  forum: string;
  comment: SerializedCommentNested;
}

const CommentReplies = ({ depth, forum, comment }: CommentRepliesProps) => {
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
  const query = useQuery(
    ["replies", comment.id],
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
