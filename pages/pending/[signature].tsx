import type { NextPage } from "next";
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
import { useConnection } from "@solana/wallet-adapter-react";

import { getPrismaPostType } from "utils/parse";
import { getEventFromSignature } from "lib/anchor/actions";
import { PostWithCommentsCountAndForum, fetchForum, fetchUser } from "lib/api";
import { useAuth } from "components/providers/auth";
import { PostHead } from "components/post/head";
import { DummyPostButtons } from "components/post/buttons";

const Pending: NextPage = () => {
  const router = useRouter();
  const auth = useAuth()!;
  const { connection } = useConnection();
  const queryClient = useQueryClient();
  const signature = router.query.signature as string;
  const signatureQueryKey = useMemo(
    () => ["signature", signature],
    [signature]
  );
  const signatureQuery = useQuery({
    queryKey: signatureQueryKey,
    queryFn: () => getEventFromSignature(connection, signature),
    enabled: Boolean(signature && auth.address),
  });

  const data = useMemo(() => {
    if (router.isReady) {
      return router.query as {
        uri: string;
        title: string;
        body: string | null;
        forum: string;
        createdAt: string;
        author: string;
        postType: PostType;
      };
    }
  }, [router]);

  useEffect(() => {
    async function updateCache(
      result: Awaited<ReturnType<typeof getEventFromSignature>>
    ) {
      const postType = getPrismaPostType(result.data.type);
      const [author, forum] = await Promise.allSettled([
        queryClient.fetchQuery(
          ["user", result.author],
          () => fetchUser(result.author as string),
          {
            retry: 0,
            staleTime: 300_000,
          }
        ),
        queryClient.fetchQuery(
          ["forum", result.forum],
          () => fetchForum(result.forum as string),
          {
            retry: 3,
            staleTime: 300_000,
          }
        ),
      ]);

      const authorResult =
        "value" in author && author.value
          ? author.value
          : {
              id: result.author,
              name: null,
              avatar: null,
              mint: null,
            };

      const forumResult =
        "value" in forum && forum.value
          ? forum.value
          : {
              id: result.forum,
            };

      queryClient.setQueryData<PostWithCommentsCountAndForum>(
        ["post", result.id],
        () => {
          const newPost: PostWithCommentsCountAndForum = {
            postType,
            id: result.id,
            nonce: BigInt(result.nonce).toString(),
            author: result.author,
            title: result.data.title!,
            body: data?.body ?? null,
            uri: result.data.uri,
            nsfw: result.data.nsfw ?? false,
            hash: "",
            dataHash: "",
            points: BigInt(0).toString(),
            awards: {},
            createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
            editedAt: null,
            Author: {
              ...authorResult,
            },
            forum: result.forum,
            // @ts-ignore
            Forum: {
              ...forumResult,
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
    console.log(result);

    if (result) {
      updateCache(result).catch((err) => {
        console.error(err);
        toast.error(err.message);
      });
    }
  }, [router, queryClient, data, signatureQuery.data]);

  const authorQuery = useQuery(
    ["user", data?.author],
    () => fetchUser(data!.author),
    {
      enabled: Boolean(data?.author),
      refetchOnMount: false,
      retry: 0,
      staleTime: 300_000,
    }
  );

  const forumQuery = useQuery(
    ["forum", data?.forum],
    () => fetchForum(data!.forum),
    {
      enabled: Boolean(data?.forum),
      refetchOnMount: false,
      staleTime: 300_000,
    }
  );

  if (!data || !forumQuery.data) {
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
        flair={null} // TODO
        body={data.body}
        uri={data.uri}
        points={0}
        awards={null}
        postType={data.postType}
        author={
          authorQuery.data ?? {
            id: data.author,
            name: null,
            avatar: null,
            mint: null,
          }
        }
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
      backgroundColor="blackAlpha.100"
    />
    <Box display="flex" mt="2" justifyContent="right">
      <Button isDisabled variant="solid" type="submit" cursor="pointer">
        Submit
      </Button>
    </Box>
  </Box>
);

export default Pending;
