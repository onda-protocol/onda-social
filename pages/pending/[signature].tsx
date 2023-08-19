import type { NextPage } from "next";
import axios from "axios";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { PostType } from "@prisma/client";
import {
  Box,
  Button,
  Container,
  Divider,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { getEventFromSignature } from "lib/anchor/actions";
import { getPrismaPostType } from "utils/parse";
import { PostWithCommentsCountAndForum, fetchForum, fetchUser } from "lib/api";
import { PostHead } from "components/post/head";
import { DummyPostButtons } from "components/post/buttons";

const Pending: NextPage = () => {
  const router = useRouter();
  const wallet = useAnchorWallet()!;
  const { connection } = useConnection();
  const queryClient = useQueryClient();
  const signature = router.query.signature as string;
  const signatureQueryKey = useMemo(
    () => ["signature", signature],
    [signature]
  );
  const signatureQuery = useQuery({
    queryKey: signatureQueryKey,
    queryFn: () => getEventFromSignature(connection, wallet, signature),
    enabled: Boolean(signature && wallet?.publicKey),
  });

  useEffect(() => {
    async function updateCache(
      result: Awaited<ReturnType<typeof getEventFromSignature>>
    ) {
      const postType = getPrismaPostType(result.data.type);
      const [author, forum, response] = await Promise.all([
        queryClient.fetchQuery(
          ["user", result.author],
          () => fetchUser(result.author),
          {
            staleTime: 300_000,
          }
        ),
        queryClient.fetchQuery(
          ["forum", result.forum],
          () => fetchForum(result.forum as string),
          {
            staleTime: 300_000,
          }
        ),
        postType === PostType.TEXT ? axios.get<string>(result.data.uri) : null,
      ]);

      queryClient.setQueryData<PostWithCommentsCountAndForum>(
        ["post", result.id],
        () => {
          const newPost: PostWithCommentsCountAndForum = {
            postType,
            id: result.id,
            nonce: BigInt(result.nonce).toString(),
            author: result.author,
            title: result.data.title!,
            body: response?.data ?? null,
            uri: result.data.uri,
            nsfw: result.data.nsfw ?? false,
            hash: "",
            points: BigInt(0).toString(),
            rewards: {},
            createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
            editedAt: null,
            Author: {
              id: result.author,
              name: author.name,
              mint: author.mint,
              avatar: author.avatar,
            },
            forum: result.forum,
            Forum: {
              ...forum,
            },
            _count: {
              Comments: 0,
            },
          };

          return newPost;
        }
      );

      router.replace(`/comments/${result.id}`);
    }

    const result = signatureQuery.data;

    if (result) {
      updateCache(result).catch((err) => {
        console.error(err);
        toast.error(err.message);
      });
    }
  }, [router, queryClient, signatureQuery.data]);

  const data = router.query as {
    uri: string;
    title: string;
    body: string | null;
    forumNamespace: string;
    createdAt: string;
    author: string;
    postType: PostType;
  };

  const authorQuery = useQuery(
    ["user", data.author],
    () => fetchUser(data.author),
    {
      staleTime: 300_000,
    }
  );

  const forumQuery = useQuery(
    ["forum", data.forumNamespace],
    () => fetchForum(data.forumNamespace),
    {
      staleTime: 300_000,
    }
  );

  if (!authorQuery.data || !forumQuery.data) {
    return (
      <Box pb="12" mx="-2">
        <Box display="flex" alignItems="center" justifyContent="center" pt="12">
          <Spinner />
        </Box>
      </Box>
    );
  }

  return (
    <Container maxW="container.md">
      <PostHead
        title={data.title}
        titleSize="3xl"
        body={data.body}
        uri={data.uri}
        points={0}
        awards={null}
        postType={data.postType}
        author={authorQuery.data}
        forum={forumQuery.data.id}
        forumNamespace={forumQuery.data.namespace}
        forumIcon={forumQuery.data?.icon}
        createdAt={data.createdAt}
        editedAt={null}
      />

      <Box mb="6">
        <DummyPostButtons />
      </Box>

      <DummyCommentEditor />

      <Divider my="6" />

      <Box pb="12" mx="-2">
        <Box display="flex" alignItems="center" justifyContent="center" pt="12">
          <Spinner />
        </Box>
      </Box>
    </Container>
  );
};

const DummyCommentEditor = () => (
  <Box>
    <Textarea
      isDisabled
      mt="2"
      placeholder="Loading..."
      minHeight="100px"
      backgroundColor="#090A20"
    />
    <Box display="flex" mt="2" justifyContent="right">
      <Button isDisabled variant="solid" type="submit" cursor="pointer">
        Submit
      </Button>
    </Box>
  </Box>
);

export default Pending;
