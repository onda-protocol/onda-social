import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Container, Heading } from "@chakra-ui/react";
import { Comment, Post } from "@prisma/client";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";

import { Editor } from "../../components/editor";

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
      <Heading as="h1">{postQuery.data?.title}</Heading>

      <Editor
        placeholder="Got some thinky thoughts?"
        config={{ type: "comment", post: id }}
        invalidateQueries={["comments", id]}
      />

      {commentsQuery.isLoading ? (
        <p>Loading...</p>
      ) : (
        commentsQuery.data?.map((comment) => (
          <div key={comment.id}>{comment.body}</div>
        ))
      )}
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
