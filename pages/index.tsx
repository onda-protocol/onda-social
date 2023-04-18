import type { NextPage } from "next";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";
import { Box, Spinner } from "@chakra-ui/react";

import { fetchPosts } from "lib/api";
import { PostListItem } from "components/post/listItem";
import { Sidebar } from "components/layout/sidebar";
import { GridLayout } from "components/layout";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const query = useQuery(["posts"], fetchPosts);

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

Home.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const queryClient = new QueryClient();
      await queryClient.prefetchQuery(["posts"], fetchPosts);

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
