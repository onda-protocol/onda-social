import type { NextPage } from "next";
import { Fragment } from "react";
import {
  DehydratedState,
  QueryClient,
  dehydrate,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Box, Spinner, Text } from "@chakra-ui/react";

import { fetchFora, fetchPosts, fetchAwards } from "lib/api";
import { PostListItem } from "components/post/listItem";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarItem,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";
import { FetchMore } from "components/fetchMore";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const queryClient = useQueryClient();

  const foraQuery = useQuery(["fora"], async () => {
    const fora = await fetchFora();
    for (const forum of fora) {
      queryClient.setQueryData(["forum", forum.namespace], forum);
    }
    return fora;
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const posts = await fetchPosts(pageParam);
      for (const post of posts) {
        queryClient.setQueryData(["post", post.id], post);
      }
      return posts;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });

  return (
    <Box mt="4">
      <GridLayout
        leftColumn={
          <Box mt="2">
            {postsQuery.isLoading ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                my="12"
              >
                <Spinner />
              </Box>
            ) : (
              postsQuery.data?.pages?.map((page, index) => (
                <Fragment key={index}>
                  {page.map((post) => (
                    <PostListItem key={post.id} post={post} />
                  ))}
                </Fragment>
              )) ?? null
            )}
            {!postsQuery.isLoading && postsQuery.hasNextPage && (
              <FetchMore
                isFetching={postsQuery.isFetchingNextPage}
                onFetchMore={postsQuery.fetchNextPage}
              />
            )}
          </Box>
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
    </Box>
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
