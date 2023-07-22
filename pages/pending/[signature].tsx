import type { NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import { Box, Container, Divider, Heading, Spinner } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";

import { getEventIdFromSignature } from "lib/anchor/actions";
import { PostType, User } from "@prisma/client";
import { PostWithCommentsCountAndForum, fetchUser } from "lib/api";
import axios from "axios";
import { PostHead } from "components/post/head";

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
    queryFn: () => getEventIdFromSignature(connection, wallet, signature),
    enabled: Boolean(signature && wallet?.publicKey),
  });

  useEffect(() => {
    async function updateCache(
      result: Awaited<ReturnType<typeof getEventIdFromSignature>>
    ) {
      const [author, response] = await Promise.all([
        queryClient.fetchQuery(["user", result.author], () =>
          fetchUser(result.author)
        ),
        axios.get<string>(result.data.uri),
      ]);

      function getPostType(postType: string): PostType {
        switch (postType) {
          case "TextPost":
            return PostType.TEXT;
          case "ImagePost":
            return PostType.IMAGE;
          default: {
            throw new Error(`Unknown post type: ${postType}`);
          }
        }
      }

      queryClient.setQueryData<PostWithCommentsCountAndForum>(
        ["post", result.id],
        () => {
          const newPost: PostWithCommentsCountAndForum = {
            id: result.id,
            nonce: BigInt(result.nonce).toString(),
            author: result.author,
            title: result.data.title!,
            body: response.data,
            uri: result.data.uri,
            postType: getPostType(result.data.type),
            nsfw: result.data.nsfw ?? false,
            hash: "",
            likes: BigInt(0).toString(),
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
              id: result.forum,
              config: result.forumConfig,
              collections: [],
              totalCapacity: BigInt(0).toString(),
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
      updateCache(result);
    }
  }, [router, queryClient, signatureQuery.data]);

  const data = router.query as {
    uri: string;
    title: string;
    body: string | null;
    forum: string;
    createdAt: string;
    // Serialized User object
    author: string;
    postType: PostType;
  };

  const user = useMemo(() => {
    try {
      return JSON.parse(data.author) as User;
    } catch (err) {
      return null;
    }
  }, [data.author]);

  if (!user) {
    // TODO: 404 error
    return null;
  }

  return (
    <Container maxW="container.md">
      <PostHead
        title={data.title}
        body={data.body}
        uri={data.uri}
        likes={0}
        postType={data.postType}
        author={user}
        forum={data.forum}
        createdAt={data.createdAt}
        editedAt={null}
      />
    </Container>
  );
};

export default Pending;
