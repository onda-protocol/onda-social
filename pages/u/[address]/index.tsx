import type { NextPage } from "next";
import {
  Avatar,
  Box,
  Button,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Spinner,
} from "@chakra-ui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { shortenAddress } from "utils/format";
import { fetchUser, fetchUserComments, fetchUserPosts } from "lib/api";
import { CommentListItem } from "components/comment";
import { useAuth } from "components/providers/auth";
import { PostList } from "components/post/list";
import { ProfileModal } from "components/modal/profile";

const User: NextPage = () => {
  const router = useRouter();
  const auth = useAuth();
  const [modal, setModal] = useState(false);
  const address = router.query.address as string;
  const query = useQuery(["user", address], () => fetchUser(address));

  const isCurrentUser = useMemo(
    () => auth.address === address,
    [address, auth.address]
  );

  const authorAddress = useMemo(() => shortenAddress(address), [address]);

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Copied address to clipboard");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Container maxW="container.md">
        <Box display="flex" flexDirection="column" alignItems="center" my="12">
          <Avatar
            size="xl"
            name={query.data?.name ?? undefined}
            src={query.data?.avatar ?? undefined}
          />
          <Box mt="6">
            {query.data?.name ? (
              <>
                <Heading size="md" textAlign="center">
                  {query.data.name}
                </Heading>
                <Box
                  aria-label="Copy address to clipboard"
                  fontSize="xs"
                  textAlign="center"
                  color="gray.500"
                  onClick={handleCopyAddress}
                >
                  {authorAddress}
                </Box>
              </>
            ) : (
              <Box
                aria-label="Copy address to clipboard"
                fontSize="xl"
                fontWeight="bold"
                textAlign="center"
                onClick={handleCopyAddress}
              >
                {authorAddress}
              </Box>
            )}
          </Box>
          {isCurrentUser && (
            <Box mt="6">
              <Button size="sm" onClick={() => setModal(true)}>
                Edit Profile
              </Button>
            </Box>
          )}
        </Box>
        <Tabs>
          <TabList>
            <Tab>Posts</Tab>
            {/* <Tab>Comments</Tab> */}
          </TabList>

          <TabPanels>
            <TabPanel px="0">
              <PostsTab id={address} />
            </TabPanel>
            {/* <TabPanel>
            <CommentsTab id={address} />
          </TabPanel> */}
          </TabPanels>
        </Tabs>
      </Container>
      <ProfileModal open={modal} onRequestClose={() => setModal(false)} />
    </>
  );
};

interface CommentsTabProps {
  id: string;
}

const CommentsTab: React.FC<CommentsTabProps> = ({ id }) => {
  const commentsQueryKey = ["user", "comments", id];
  const commentsQuery = useQuery(commentsQueryKey, () => fetchUserComments(id));

  return commentsQuery.isLoading ? (
    <Box display="flex" alignItems="center" justifyContent="center">
      <Spinner />
    </Box>
  ) : (
    <Box pb="12">
      {commentsQuery.data?.map((comment) => (
        <CommentListItem
          disableReplies={true}
          key={comment.id}
          forum={comment.Post.forum}
          postAuthor={comment.Post.author}
          comment={comment}
          queryKey={commentsQueryKey}
        />
      )) ?? null}
    </Box>
  );
};

interface PostsTabProps {
  id: string;
}

const PostsTab: React.FC<PostsTabProps> = ({ id }) => {
  const postsQuery = useInfiniteQuery({
    queryKey: ["posts", { user: id }],
    queryFn: async ({ pageParam = 0 }) => fetchUserPosts(id, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });

  return (
    <PostList
      data={postsQuery.data}
      isLoading={postsQuery.isLoading}
      shouldFetchMore={postsQuery.hasNextPage}
      isFetchingMore={postsQuery.isFetchingNextPage}
      onFetchMore={() => postsQuery.fetchNextPage()}
    />
  );
};

export default User;
