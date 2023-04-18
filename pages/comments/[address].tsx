import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Box, Container, Divider, Heading, Spinner } from "@chakra-ui/react";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react";

import {
  SerializedCommentNested,
  fetchPost,
  fetchComments,
  fetchUser,
} from "lib/api";
import { Editor } from "components/editor";
import { Markdown } from "components/markdown";
import { CommentListItem } from "components/comment";
import { PostMeta } from "components/post/meta";
import { PostButtons } from "components/post/ItemButtons";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Comments: NextPage<PageProps> = () => {
  const router = useRouter();
  const id = router.query.address as string;
  const postQuery = useQuery(["post", id], () => fetchPost(id));
  const commentsQueryKey = ["comments", id];
  const commentsQuery = useQuery(commentsQueryKey, () => fetchComments(id));

  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();

  const onUpdateCache = useCallback(
    async (entryId: string, nonce: string, body: string) => {
      if (anchorWallet === undefined) return;

      const userAddress = anchorWallet.publicKey.toBase58();
      const author = await queryClient.fetchQuery(["user", userAddress], () =>
        fetchUser(userAddress)
      );

      queryClient.setQueryData<SerializedCommentNested[]>(
        ["comments", id],
        (data) => {
          const newComment = {
            id: entryId,
            createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
            editedAt: null,
            parent: null,
            post: id,
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
    },
    [anchorWallet, id, queryClient]
  );

  if (!postQuery.data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Container maxW="container.md">
      <Box mt="12">
        <PostMeta
          author={postQuery.data.Author}
          forum={postQuery.data.forum}
          createdAt={String(postQuery.data.createdAt)}
        />
        <Heading my="6" as="h1">
          {postQuery.data?.title}
        </Heading>
      </Box>
      <Box mb="6">
        <Markdown>{postQuery.data?.body ?? ""}</Markdown>
      </Box>

      <Box mb="6">
        <PostButtons post={postQuery.data} />
      </Box>

      <Editor
        buttonLabel="Comment"
        placeholder="Got some thinky thoughts?"
        config={{
          type: "comment",
          post: id,
          forum: postQuery.data?.forum,
          parent: null,
        }}
        onUpdate={onUpdateCache}
      />

      <Divider my="6" />

      <Box pb="12">
        {commentsQuery.isLoading ? (
          <Box display="flex" alignItems="center" justifyContent="center">
            <Spinner />
          </Box>
        ) : (
          commentsQuery.data?.map((comment) => (
            <CommentListItem
              key={comment.id}
              forum={postQuery.data?.forum}
              comment={comment}
              queryKey={commentsQueryKey}
            />
          )) ?? null
        )}
      </Box>
    </Container>
  );
};

Comments.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const queryClient = new QueryClient();
      const id = ctx.query.address as string;
      await queryClient.prefetchQuery(["post", id], () => fetchPost(id));

      return {
        dehydratedState: dehydrate(queryClient),
      };
    } catch (err) {
      console.log(err);
    }
  }

  return {
    dehydratedState: undefined,
  };
};

export default Comments;
