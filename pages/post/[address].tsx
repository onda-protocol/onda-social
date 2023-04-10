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

import { Editor } from "../../components/editor";
import { Markdown } from "../../components/markdown";
import { CommentListItem } from "../../components/comment";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Post: NextPage<PageProps> = () => {
  const router = useRouter();
  const id = router.query.address as string;
  const postQuery = useQuery(["post", id], () => fetchPost(id));
  const commentsQuery = useQuery(["comments", id], () => fetchComments(id));

  return (
    <Container maxW="container.md">
      <Heading as="h1" my="12">
        {postQuery.data?.title}
      </Heading>
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
            <CommentListItem key={comment.id} {...comment} />
          ))
        )}
      </Box>
    </Container>
  );
};

Post.getInitialProps = async (ctx) => {
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

export default Post;

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
