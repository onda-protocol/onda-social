import type { NextPage } from "next";
import { useEffect } from "react";
import {
  DehydratedState,
  QueryClient,
  dehydrate,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Box, Spinner, Text } from "@chakra-ui/react";

import { getProfiles } from "utils/profile";
import { fetchFora, fetchPosts, fetchAwards } from "lib/api";
import { PostListItem } from "components/post/listItem";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarItem,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const queryClient = useQueryClient();
  const postsQuery = useQuery(["posts"], fetchPosts);
  const foraQuery = useQuery(["fora"], fetchFora);

  // Seed posts to cache
  useEffect(() => {
    if (postsQuery.data) {
      for (const post of postsQuery.data) {
        queryClient.setQueryData(["post", post.id], post);
      }
    }
  }, [queryClient, postsQuery.data]);

  useEffect(() => {
    if (foraQuery.data) {
      for (const forum of foraQuery.data) {
        queryClient.setQueryData(["forum", forum.namespace], forum);
      }
    }
  }, [queryClient, foraQuery.data]);

  return (
    <Box mt="4">
      <GridLayout
        leftColumn={
          <Box mt="2">
            {postsQuery.isLoading ? (
              <Box display="flex" alignItems="center" justifyContent="center">
                <Spinner />
              </Box>
            ) : (
              postsQuery.data?.map((post) => (
                <PostListItem key={post.id} post={post} />
              )) ?? null
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
        queryClient.prefetchQuery(["posts"], fetchPosts),
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
