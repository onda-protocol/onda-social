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
import { useQuery } from "@tanstack/react-query";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { shortenAddress } from "utils/format";
import { fetchUser, fetchUserComments, fetchUserPosts } from "lib/api";
import { CommentListItem } from "components/comment";
import { PostListItem } from "components/post/listItem";

const User: NextPage = () => {
  const router = useRouter();
  const anchorWallet = useAnchorWallet();
  const address = router.query.address as string;
  const query = useQuery(["user", address], () => fetchUser(address));

  const isCurrentUser = useMemo(
    () => anchorWallet?.publicKey?.toBase58() === address,
    [address, anchorWallet]
  );

  const authorAddress = useMemo(
    () => (query.data ? shortenAddress(query.data.id) : null),
    [query.data]
  );

  return (
    <Container maxW="container.md">
      <Box display="flex" flexDirection="column" alignItems="center" my="12">
        <Avatar
          size="xl"
          name={query.data?.name ?? undefined}
          src={query.data?.avatar ?? undefined}
        />
        <Box mt="6">
          <Heading size="md">{query.data?.name ?? authorAddress}</Heading>
        </Box>
        <Box mt="6">
          {isCurrentUser && (
            <Link href={`/u/${address}/edit`}>
              <Button size="sm">Edit Profile</Button>
            </Link>
          )}
        </Box>
      </Box>
      <Tabs>
        <TabList>
          <Tab>Posts</Tab>
          <Tab>Comments</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <PostsTab id={address} />
          </TabPanel>
          <TabPanel>
            <CommentsTab id={address} />
          </TabPanel>
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
