import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { Box, Container, Divider, Spinner } from "@chakra-ui/react";
import {
  DehydratedState,
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAnchorWallet } from "@solana/wallet-adapter-react";

import type { EntryForm } from "components/editor";
import {
  SerializedCommentNested,
  fetchPost,
  fetchComments,
  fetchUser,
  PostWithCommentsCountAndForum,
  AwardsJson,
  fetchAwards,
} from "lib/api";
import { CommentListItem } from "components/comment";
import { PostButtons } from "components/post/buttons";
import { PostHead } from "components/post/head";
import { useAuth } from "components/providers/auth";

const Editor = dynamic(
  () => import("components/editor").then((mod) => mod.Editor),
  { ssr: false }
);

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Comments: NextPage<PageProps> = () => {
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const id = router.query.address as string;

  const postQueryKey = useMemo(() => ["post", id], [id]);
  const postQuery = useQuery({
    queryKey: postQueryKey,
    queryFn: () => fetchPost(id),
    refetchOnMount: false,
  });
  const commentsQueryKey = useMemo(() => ["comments", id], [id]);
  const commentsQuery = useQuery(commentsQueryKey, () => fetchComments(id));

  const isAuthor = useMemo(
    () => Boolean(auth.address && auth.address === postQuery.data?.author),
    [auth, postQuery.data?.author]
  );
  const isDeleted = useMemo(
    () => postQuery.data?.body === "[deleted]",
    [postQuery.data?.body]
  );

  const onCommentCreated = useCallback(
    async (_: string, uri: string, entry: EntryForm) => {
      if (!auth.address) return;

      const userAddress = auth.address;
      const author = await queryClient.fetchQuery(["user", userAddress], () =>
        fetchUser(userAddress)
      );

      queryClient.setQueryData<SerializedCommentNested[]>(
        commentsQueryKey,
        (data) => {
          const newComment: SerializedCommentNested = {
            uri,
            id: Math.random().toString(36),
            createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
            editedAt: null,
            parent: null,
            post: id,
            body: entry.body,
            nsfw: false,
            points: BigInt(0).toString(),
            awards: {},
            nonce: BigInt(0).toString(),
            hash: "",
            author: userAddress,
            Author: author,
            Votes: [],
            _vote: null,
            Children: [],
            _count: { Children: 0 },
          } as SerializedCommentNested;

          return [newComment, ...(data ?? [])];
        }
      );
    },
    [auth, id, queryClient, commentsQueryKey]
  );

  const onPostDeleted = useCallback(() => {
    queryClient.setQueryData<PostWithCommentsCountAndForum>(
      postQueryKey,
      (data) => {
        if (data) {
          const post: PostWithCommentsCountAndForum = {
            ...data,
            uri: "[deleted]",
            body: "[deleted]",
            editedAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
          };
          return post;
        }
      }
    );
  }, [queryClient, postQueryKey]);

  if (!postQuery.data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" py="12">
        <Spinner />
      </Box>
    );
  }

  return (
    <Container maxW="container.md">
      <PostHead
        title={postQuery.data?.title}
        titleSize="3xl"
        body={postQuery.data?.body}
        uri={postQuery.data?.uri}
        points={Number(postQuery.data.points)}
        awards={postQuery.data.awards as AwardsJson}
        postType={postQuery.data.postType}
        author={postQuery.data.Author}
        forum={postQuery.data.forum}
        forumNamespace={postQuery.data.Forum.namespace}
        forumIcon={postQuery.data.Forum.icon}
        createdAt={postQuery.data.createdAt}
        editedAt={postQuery.data.editedAt}
      />

      <Box mb="6">
        <PostButtons
          post={postQuery.data}
          displayDelete={isAuthor && !isDeleted}
          onDeleted={onPostDeleted}
        />
      </Box>

      <Editor
        buttonLabel="Comment"
        placeholder="Got some thoughts?"
        successMessage="Reply added"
        config={{
          type: "comment",
          post: id,
          forum: postQuery.data?.forum,
          parent: null,
        }}
        onSuccess={onCommentCreated}
      />

      <Divider my="6" />

      <Box pb="12" mx="-2">
        {commentsQuery.isLoading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            pt="12"
          >
            <Spinner />
          </Box>
        ) : (
          commentsQuery.data?.map((comment) => (
            <CommentListItem
              isRoot
              key={comment.id}
              comment={comment}
              forum={postQuery.data?.forum}
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

      await Promise.allSettled([
        queryClient.prefetchQuery(["post", id], () =>
          fetchPost(id, ctx.req?.headers)
        ),
        queryClient.prefetchQuery(["awards"], fetchAwards),
      ]);

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
