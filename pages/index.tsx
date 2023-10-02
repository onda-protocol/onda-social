import type { NextPage } from "next";
import {
  DehydratedState,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Box, Text } from "@chakra-ui/react";
import Image from "next/image";
import { motion, useScroll, useTransform, circOut } from "framer-motion";

import { fetchFora, fetchPosts } from "lib/api";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarItem,
  SidebarItemSkeleton,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";
import { PostList } from "components/post/list";
import { PostModal } from "components/modal/post";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const scroll = useScroll();
  const opacity = useTransform(scroll.scrollY, [0, 190], [0, 1], {
    ease: circOut,
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
            src="/banner2.png"
            alt="Homepage banner"
            style={{
              objectFit: "cover",
              objectPosition: "bottom",
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
                    Decentralized, community moderated forums. Powered by
                    Solana.
                  </Text>
                </Box>
                <SidebarButtons />
              </SidebarSection>
              <SidebarSection title="Communities">
                <ForumList />
              </SidebarSection>
            </Box>
          </Sidebar>
        }
      />
      <PostModal />
    </>
  );
};

const ForumList = () => {
  const queryClient = useQueryClient();

  const foraQuery = useQuery(["fora"], async () => {
    const fora = await fetchFora();
    for (const forum of fora) {
      queryClient.setQueryData(["forum", forum.id], forum);
      queryClient.setQueryData(["forum", "namespace", forum.namespace], forum);
    }
    return fora;
  });

  if (foraQuery.isLoading)
    return (
      <>
        <SidebarItemSkeleton />
        <SidebarItemSkeleton />
        <SidebarItemSkeleton />
        <SidebarItemSkeleton />
        <SidebarItemSkeleton />
      </>
    );

  return (
    <>
      {foraQuery.data?.map((forum) => (
        <SidebarItem
          key={forum.id}
          active={false}
          href={`/o/${forum.namespace}`}
          label={forum.displayName!}
          image={forum.icon}
        />
      ))}
    </>
  );
};

export default Home;
