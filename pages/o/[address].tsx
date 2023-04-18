import type { NextPage } from "next";
import { useRouter } from "next/router";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";
import { Box, Container, Spinner } from "@chakra-ui/react";

import { fetchPostsByForum } from "lib/api";
import { PostListItem } from "components/post/listItem";
import { Sidebar } from "components/layout/sidebar";
import { GridLayout } from "components/layout";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Community: NextPage<PageProps> = () => {
  const router = useRouter();
  const id = router.query.address as string;
  const query = useQuery(["posts", "o", id], () => fetchPostsByForum(id));

  return (
    <GridLayout
      leftColumn={
        <Box mt="6">
          {query.isLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center">
              <Spinner />
            </Box>
          ) : (
            query.data?.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))
          )}
        </Box>
      }
      rightColumn={<Sidebar />}
    />
  );
};

Community.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const address = ctx.query.address as string;
      const queryClient = new QueryClient();
      await queryClient.prefetchQuery(["posts", "o", address], () =>
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

export default Community;
