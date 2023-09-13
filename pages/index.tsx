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
import { useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, circOut } from "framer-motion";

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
  const scroll = useScroll();
  const opacity = useTransform(scroll.scrollY, [0, 190], [0, 1], {
    ease: circOut,
  });

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
    <>
      <Box position="relative" height="200px" width="100%" zIndex={-1}>
        <Box position="fixed" height="200px" width="100%">
          <Image
            fill
            src="/banner.svg"
            alt="Homepage banner"
            style={{
              objectFit: "cover",
              objectPosition: "left 75%",
            }}
          />
        </Box>
        <Box
          as={motion.div}
          position="fixed"
          inset={0}
          backgroundColor="onda.1000"
          style={{ opacity }}
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          height="20px"
          width="100%"
          backgroundColor="onda.1000"
          borderTopRadius="20px"
          zIndex={1}
        />
      </Box>
      <GridLayout
        leftColumn={
          <PostList
            displayIcon
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
    </>
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
