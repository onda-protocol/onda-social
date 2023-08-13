import type { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
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
  fetchForum,
  fetchForumByNamespace,
  fetchPostsByForumNamespace,
} from "lib/api";
import { PostListItem } from "components/post/listItem";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarList,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";

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

  console.log(forumQuery);

  const postsQuery = useQuery(["posts", "o", namespace], () =>
    fetchPostsByForumNamespace(namespace)
  );

  return (
    <>
      <Box>
        <Box
          height={forumQuery.data?.banner ? "180px" : "90px"}
          backgroundColor="onda.600"
          backgroundImage={forumQuery.data?.banner as string}
          backgroundPosition="center"
        />
        <Box bgColor="onda.1000">
          <Container maxW="container.lg">
            <Box display="flex" py="4" marginTop="-8">
              {forumQuery.data?.icon && (
                <Box mr="2" p="3px" bgColor="#fff" borderRadius="100%">
                  <Image
                    alt={forumQuery.data.namespace + " logo"}
                    src={forumQuery.data.icon}
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
                    postsQuery.data?.map((post) => (
                      <PostListItem
                        key={post.id}
                        displayIcon={false}
                        post={post}
                      />
                    ))
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
                  <SidebarSection title="Links">
                    <SidebarList>
                      {/* {links?.twitter && (
                        <SidebarLink href={links.twitter} label="Twitter" />
                      )}
                      {links?.discord && (
                        <SidebarLink href={links.discord} label="Discord" />
                      )}
                      {links?.website && (
                        <SidebarLink href={links.website} label="Website" />
                      )} */}
                    </SidebarList>
                  </SidebarSection>
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
      const address = ctx.query.address as string;
      const queryClient = new QueryClient();
      await queryClient.prefetchQuery(["posts", "o", address], () =>
        fetchPostsByForumNamespace(address)
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
