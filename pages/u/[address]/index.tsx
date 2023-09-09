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
  Text,
  TabPanel,
  Heading,
  Spinner,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import toast from "react-hot-toast";

import { shortenAddress } from "utils/format";
import { fetchUser, fetchUserComments, fetchUserPosts } from "lib/api";
import { CommentListItem } from "components/comment";
import { PostListItem } from "components/post/listItem";
import { useAuth } from "components/providers/auth";

const User: NextPage = () => {
  const router = useRouter();
  const auth = useAuth();
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
            <Link href={`/u/${address}/edit`}>
              <Button size="sm">Edit Profile</Button>
            </Link>
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
  const postsQueryKey = ["user", "posts", id];
  const postsQuery = useQuery(postsQueryKey, () => fetchUserPosts(id));

  return postsQuery.isLoading ? (
    <Box display="flex" alignItems="center" justifyContent="center">
      <Spinner />
    </Box>
  ) : (
    <Box pb="12">
      {postsQuery.data?.map((post) => (
        <PostListItem key={post.id} post={post} />
      )) ?? null}
    </Box>
  );
};

export default User;
