import type { NextPage } from "next";
import { useRouter } from "next/router";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
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
  getDescriptionFromAddress,
  getImageFromAddress,
  getLinksFromAddress,
  getNameFromAddress,
} from "utils/profile";
import { fetchPostsByForum } from "lib/api";
import { PostListItem } from "components/post/listItem";
import {
  Sidebar,
  SidebarSection,
  SidebarButtons,
  SidebarList,
  SidebarLink,
} from "components/layout/sidebar";
import { GridLayout } from "components/layout";
import Image from "next/image";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Community: NextPage<PageProps> = () => {
  const router = useRouter();
  const id = router.query.address as string;
  const query = useQuery(["posts", "o", id], () => fetchPostsByForum(id));

  const image = getImageFromAddress(id);
  const name = getNameFromAddress(id);
  const links = getLinksFromAddress(id);

  return (
    <>
      <Box>
        <Box
          height="180px"
          backgroundImage="https://uploads-ssl.webflow.com/613eaeea238773c51dcfd629/627771cb11ba1157594db622_Header%20BG.png"
          backgroundPosition="center"
        />
        <Box bgColor="onda.1000">
          <Container maxW="container.lg">
            <Box display="flex" py="4" marginTop="-8">
              {image && (
                <Box mr="2" p="3px" bgColor="#fff" borderRadius="100%">
                  <Image
                    alt={name}
                    src={image}
                    height={72}
                    width={72}
                    style={{
                      borderRadius: "100%",
                    }}
                  />
                </Box>
              )}
              <Box mt="8">
                <Heading mb="2" size="md">
                  {name}
                </Heading>
                <Heading color="gray.500" fontWeight="medium" size="xs">
                  o/{id}
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
                  {query.isLoading ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Spinner />
                    </Box>
                  ) : (
                    query.data?.map((post) => (
                      <PostListItem key={post.id} post={post} />
                    ))
                  )}
                </Box>
              }
              rightColumn={
                <Sidebar>
                  <SidebarSection title="About">
                    <Box px="4">
                      <Text>{getDescriptionFromAddress(id)}</Text>
                    </Box>
                    <SidebarButtons />
                  </SidebarSection>
                  <SidebarSection title="Links">
                    <SidebarList>
                      {links?.twitter && (
                        <SidebarLink href={links.twitter} label="Twitter" />
                      )}
                      {links?.discord && (
                        <SidebarLink href={links.discord} label="Discord" />
                      )}
                      {links?.website && (
                        <SidebarLink href={links.website} label="Website" />
                      )}
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
