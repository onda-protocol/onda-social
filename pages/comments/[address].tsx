import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Box, Container, Divider, Heading, Spinner } from "@chakra-ui/react";
import { Comment, Post } from "@prisma/client";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";

import { Editor } from "components/editor";
import { Markdown } from "components/markdown";
import { CommentListItem } from "components/comment";
import { PostMeta } from "components/post/meta";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Comments: NextPage<PageProps> = () => {
  const router = useRouter();
  const id = router.query.address as string;
  const postQuery = useQuery(["post", id], () => fetchPost(id));
  const commentsQuery = useQuery(["comments", id], () => fetchComments(id));

  return (
    <Container maxW="container.md">
      <Box my="12">
        <PostMeta
          author={postQuery.data?.author}
          forum={postQuery.data?.forum}
          createdAt={String(postQuery.data?.createdAt)}
        />
        <Heading as="h1">{postQuery.data?.title}</Heading>
      </Box>
      <Box mb="6">
        <Markdown>{postQuery.data?.body ?? ""}</Markdown>
      </Box>

      <Editor
        buttonLabel="Comment"
        placeholder="Got some thinky thoughts?"
        config={{ type: "comment", post: id, parent: null }}
        invalidateQueries={["comments", id]}
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
              {...comment}
              createdAt={String(comment.createdAt)}
            />
          ))
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

function fetchPost(id: string): Promise<Post> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/post/${id}`).then((res) =>
    res.json()
  );
}

function fetchComments(id: string): Promise<Comment[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/post/${id}/comments`).then(
    (res) => res.json()
  );
}
