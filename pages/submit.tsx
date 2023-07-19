import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Container, Heading } from "@chakra-ui/react";
import { PostType } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";

import {
  PostWithCommentsCountAndForum,
  SerializedForum,
  fetchUser,
} from "lib/api";
import { Editor } from "components/editor";

const Submit: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const forum = router.query.o as string | undefined;

  const onUpdateCache = useCallback(
    async (vars: {
      id: string;
      nonce: string;
      title: string;
      nsfw?: boolean;
      body: string;
      uri: string;
      postType: PostType;
      author: string;
      Forum: SerializedForum;
    }) => {
      const author = await queryClient.fetchQuery(["user", vars.author], () =>
        fetchUser(vars.author)
      );

      queryClient.setQueriesData<PostWithCommentsCountAndForum[]>(
        { queryKey: ["posts"], exact: false },
        (data) => {
          const newPost: PostWithCommentsCountAndForum = {
            ...vars,
            nsfw: vars.nsfw ?? false,
            hash: "",
            likes: BigInt(0).toString(),
            createdAt: BigInt(Math.floor(Date.now() / 1000)).toString(),
            editedAt: null,
            Author: {
              ...author,
            },
            forum: vars.Forum.id,
            Forum: {
              ...vars.Forum,
            },
            _count: {
              Comments: 0,
            },
          };

          if (data) {
            return [newPost, ...data];
          }

          return [newPost];
        }
      );
    },
    [queryClient]
  );

  return (
    <Container maxW="3xl">
      <Heading size="md" my="9">
        Create a post
      </Heading>
      <Editor
        config={{ type: "post", forum }}
        invalidateQueries={["posts"]}
        onUpdate={onUpdateCache}
        redirect="/"
        buttonLabel="Post"
        successMessage="Post created!"
      />
    </Container>
  );
};

export default Submit;
