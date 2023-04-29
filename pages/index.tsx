import type { NextPage } from "next";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
} from "@tanstack/react-query";
import { Box, Spinner, Text } from "@chakra-ui/react";

import { getProfiles } from "utils/profile";
import { fetchPosts } from "lib/api";
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
  const query = useQuery(["posts"], fetchPosts);

  return (
    <Box mt="4">
      <GridLayout
        leftColumn={
          <Box mt="2">
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
                {getProfiles().map((profile) => (
                  <SidebarItem
                    key={profile.id}
                    active={false}
                    href={`/o/${profile.id}`}
                    label={profile.name}
                    image={profile.image}
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
