import type { NextPage } from "next";
import {
  DehydratedState,
  QueryClient,
  dehydrate,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Box, Text } from "@chakra-ui/react";

import { fetchFora, fetchPosts, fetchAwards } from "lib/api";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarItem,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";
import { PostList } from "components/post/list";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const queryClient = useQueryClient();

  const foraQuery = useQuery(["fora"], async () => {
    const fora = await fetchFora();
    for (const forum of fora) {
      queryClient.setQueryData(["forum", forum.id], forum);
      queryClient.setQueryData(["forum", "namespace", forum.namespace], forum);
    }
    return fora;
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 0 }) => fetchPosts(pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });

  return (
    <GridLayout
      leftColumn={
        <PostList
          data={postsQuery.data}
          isLoading={postsQuery.isLoading}
          shouldFetchMore={postsQuery.hasNextPage}
          isFetchingMore={postsQuery.isFetchingNextPage}
          onFetchMore={postsQuery.fetchNextPage}
        />
      }
      rightColumn={
        <Sidebar>
          <Box>
            <SidebarSection title="Home">
              <Box px="4">
                <Text>
                  Welcome to Onda. The place to discover and engage with web3
                  Communities, powered by the Solana blockchain.
                </Text>
              </Box>
              <SidebarButtons />
            </SidebarSection>
            <SidebarSection title="Communities">
              {foraQuery.data?.map((forum) => (
                <SidebarItem
                  key={forum.id}
                  active={false}
                  href={`/o/${forum.namespace}`}
                  label={forum.displayName!}
                  image={forum.icon}
                />
              ))}
            </SidebarSection>
          </Box>
        </Sidebar>
      }
    />
  );
};

Home.getInitialProps = async () => {
  if (typeof window === "undefined") {
    try {
      const queryClient = new QueryClient();

      await Promise.allSettled([
        queryClient.prefetchQuery(["fora"], fetchFora),
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

export default Home;
