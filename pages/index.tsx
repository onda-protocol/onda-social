import type { NextPage } from "next";
import * as anchor from "@project-serum/anchor";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { Box } from "@chakra-ui/react";

import { getProgram, PROGRAM_ID } from "lib/anchor/provider";
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
        <Box mt="6" borderTop="1px" borderColor="gray.800" borderRadius="md">
          {query.data?.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
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
