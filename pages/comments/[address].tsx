import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Fragment, useCallback, useMemo } from "react";
import { Box, Container, Divider, Spinner } from "@chakra-ui/react";
import {
  DehydratedState,
  InfiniteData,
  QueryClient,
  dehydrate,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  SerializedCommentNested,
  fetchPost,
  fetchComments,
  fetchUser,
  PostWithCommentsCountAndForum,
  AwardsJson,
} from "lib/api";
import type { EntryForm } from "components/editor";
import { CommentListItem } from "components/comment";
import { PostButtons } from "components/post/buttons";
import { PostHead } from "components/post/head";
import { useAuth } from "components/providers/auth";
import { FetchMore } from "components/fetchMore";
import { DocumentHead } from "components/document";

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
  const limit = 20;
  const commentsQueryKey = useMemo(() => ["comments", id], [id]);
  const commentsQuery = useInfiniteQuery({
    queryKey: commentsQueryKey,
    queryFn: async ({ pageParam = 0 }) => fetchComments(id, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * limit : undefined,
  });

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

      queryClient.setQueryData<InfiniteData<SerializedCommentNested[]>>(
        commentsQueryKey,
        (data) => {
          if (data) {
            const firstPage = data?.pages[0] ?? [];
            const rest = data?.pages.slice(1) ?? [];

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
              dataHash: "",
              author: userAddress,
              Author: author,
              Votes: [],
              _vote: null,
              Children: [],
              _count: { Children: 0 },
            } as SerializedCommentNested;

            return {
              ...data,
              pages: [[newComment, ...firstPage], ...rest],
            };
          }
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
    <>
      <DocumentHead
        title={postQuery.data.title}
        description={`Posted in o/${postQuery.data.Forum.namespace} ${
          postQuery.data.Author.name ? `by u/${postQuery.data.Author.name}` : ""
        }`}
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/comments/${postQuery.data.id}`}
      />
      <Container maxW="container.md" pt="4">
        <PostHead
          title={postQuery.data?.title}
          titleSize="3xl"
          flair={postQuery.data?.Flair}
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
            displayVote
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
            commentsQuery.data?.pages?.map((page, index) => (
              <Fragment key={index}>
                {page.map((comment) => (
                  <CommentListItem
                    isRoot
                    key={comment.id}
                    comment={comment}
                    postAuthor={postQuery.data?.author}
                    forum={postQuery.data?.forum}
                    queryKey={commentsQueryKey}
                  />
                ))}
              </Fragment>
            )) ?? null
          )}
          {!commentsQuery.isLoading && commentsQuery.hasNextPage && (
            <FetchMore
              isFetching={commentsQuery.isFetchingNextPage}
              onFetchMore={commentsQuery.fetchNextPage}
            />
          )}
        </Box>
      </Container>
    </>
  );
};

Comments.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const queryClient = new QueryClient();
      const id = ctx.query.address as string;

      await queryClient.prefetchQuery(["post", id], () =>
        fetchPost(id, ctx.req?.headers)
      );

      return {
        dehydratedState: dehydrate(queryClient),
      };
    } catch (err) {
      console.log("ERROR: ", err);
    }
  }

  return {
    dehydratedState: undefined,
  };
};

export default Comments;
