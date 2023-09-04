import type { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Box,
  Container,
  Spinner,
  Text,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";

import {
  fetchAwards,
  fetchForumByNamespace,
  fetchPostsByForumNamespace,
} from "lib/api";
import { PostListItem } from "components/post/listItem";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarList,
  SidebarLink,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";
import { Fragment } from "react";
import { FetchMore } from "components/fetchMore";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Community: NextPage<PageProps> = () => {
  const router = useRouter();
  const namespace = router.query.namespace as string;
  const queryClient = useQueryClient();

  const forumQuery = useQuery(["forum", "namespace", namespace], async () => {
    const forum = await fetchForumByNamespace(namespace);

    if (forum) {
      queryClient.setQueryData(["forum", forum.id], forum);
    }

    return forum;
  });

  const postsQuery = useInfiniteQuery({
    queryKey: ["posts", "o", namespace],
    queryFn: async ({ pageParam = 0 }) => {
      const posts = await fetchPostsByForumNamespace(namespace, pageParam);
      for (const post of posts) {
        queryClient.setQueryData(["post", post.id], post);
      }
      return posts;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });

  return (
    <>
      <Box>
        <Box
          position="relative"
          height={forumQuery.data?.banner ? "180px" : "90px"}
          backgroundColor="onda.600"
          zIndex="0"
        >
          {forumQuery.data?.banner ? (
            <Image
              fill
              src={forumQuery.data.banner}
              alt={forumQuery.data.namespace + " banner"}
            />
          ) : null}
        </Box>
        <Box bgColor="onda.1000">
          <Container maxW="container.lg">
            <Box display="flex" py="4" marginTop="-8">
              {forumQuery.data?.icon && (
                <Box
                  position="relative"
                  mr="2"
                  p="3px"
                  bgColor="#fff"
                  borderRadius="100%"
                  zIndex="1"
                >
                  <Image
                    alt={forumQuery.data.namespace + " logo"}
                    src={forumQuery.data.icon + "?discriminator=1"}
                    height={78}
                    width={78}
                    style={{
                      borderRadius: "100%",
                    }}
                  />
                </Box>
              )}
              <Box mt="8">
                <Heading mb="1" size="md">
                  {forumQuery.data?.displayName}
                </Heading>
                <Heading color="gray.500" fontWeight="medium" size="xs">
                  o/{namespace}
                </Heading>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
      <Tabs colorScheme="gray">
        <TabList borderColor="gray.800">
          <Container maxW="container.lg">
            <Tab pb="1">Posts</Tab>
          </Container>
        </TabList>
        <TabPanels>
          <TabPanel>
            <GridLayout
              leftColumn={
                <Box mt="2">
                  {postsQuery.isLoading ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Spinner />
                    </Box>
                  ) : (
                    postsQuery.data?.pages?.map((post, index) => (
                      <Fragment key={index}>
                        {post.map((post) => (
                          <PostListItem
                            key={post.id}
                            displayIcon={false}
                            post={post}
                          />
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
                  <SidebarSection title="About">
                    <Box px="4">
                      <Text>{forumQuery.data?.description}</Text>
                    </Box>
                    <SidebarButtons forum={forumQuery.data?.id} />
                  </SidebarSection>
                  {Array.isArray(forumQuery.data?.links) ? (
                    <SidebarSection title="Links">
                      <SidebarList>
                        {forumQuery.data?.links.map((link, index) => (
                          <SidebarLink
                            key={index}
                            href={link.url}
                            label={link.name}
                          />
                        ))}
                      </SidebarList>
                    </SidebarSection>
                  ) : null}
                </Sidebar>
              }
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};

Community.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const namespace = ctx.query.namespace as string;
      const queryClient = new QueryClient();

      await Promise.allSettled([
        queryClient.prefetchQuery(["forum", "namespace", namespace], () =>
          fetchForumByNamespace(namespace)
        ),
        // queryClient.prefetchQuery(["posts", "o", address], () =>
        //   fetchPostsByForumNamespace(address)
        // ),
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

export default Community;
