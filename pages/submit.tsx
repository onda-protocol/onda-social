import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Box, Container, Heading, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

import type { EntryForm } from "components/editor";
import { getPrismaPostType } from "utils/parse";
import { fetchUser } from "lib/api";
import { useAuth } from "components/providers/auth";

const Editor = dynamic(
  () => import("components/editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" p="12">
        <Spinner />
      </Box>
    ),
  }
);

const Submit: NextPage = () => {
  const router = useRouter();
  const auth = useAuth();
  const forum = router.query.o as string | undefined;

  useQuery(["user", auth.address], () => fetchUser(auth.address!), {
    enabled: Boolean(auth.address),
  });

  const onSuccess = useCallback(
    async (signature: string, uri: string, variables: EntryForm) => {
      router.push({
        pathname: `/pending/${signature}`,
        query: {
          uri,
          title: variables.title,
          body: variables.body,
          forum: variables.forum,
          author: auth.address,
          postType: getPrismaPostType(variables.postType),
        },
      });
    },
    [router, auth]
  );

  return (
    <Container maxW="3xl">
      <Heading size="md" my="9">
        Create a post
      </Heading>
      <Editor
        config={{ type: "post", forum }}
        buttonLabel="Post"
        successMessage="Post created!"
        onSuccess={onSuccess}
      />
    </Container>
  );
};

export default Submit;
