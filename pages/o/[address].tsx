import type { NextPage } from "next";
import { useRouter } from "next/router";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";
import { Box, Container } from "@chakra-ui/react";
import { Post } from "@prisma/client";

import { PostListItem } from "components/post/listItem";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const router = useRouter();
  const query = useQuery(["posts", router.query.address as string], () =>
    fetchPostsByForum(router.query.address as string)
  );

  return (
    <Container maxW="container.md">
      <Box borderLeftWidth="1px" borderRightWidth="1px" borderColor="gray.800">
        {query.data?.map((post) => (
          <PostListItem
            key={post.id}
            id={post.id}
            title={post.title!}
            body={post.body!}
          />
        ))}
      </Box>
    </Container>
  );
};

Home.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const address = ctx.query.address as string;
      const queryClient = new QueryClient();
      await queryClient.prefetchQuery(["posts", address], () =>
        fetchPostsByForum(address)
      );

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

export default Home;

function fetchPostsByForum(address: string): Promise<Post[]> {
  return fetch(`${process.env.NEXT_PUBLIC_HOST}/api/posts/${address}`).then(
    (res) => res.json()
  );
}
