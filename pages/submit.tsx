import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Box, Container, Heading, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";

import type { EntryForm } from "components/editor";
import { fetchUser } from "lib/api";
import { getPrismaPostType } from "utils/parse";

const EditorProvider = dynamic(
  () => import("components/editor").then((mod) => mod.EditorProvider),
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
  const wallet = useWallet();
  const forum = router.query.o as string | undefined;

  useQuery(
    ["user", wallet.publicKey?.toBase58()],
    () => fetchUser(wallet.publicKey?.toBase58()!),
    {
      enabled: Boolean(wallet.publicKey),
    }
  );

  const onSuccess = useCallback(
    async (signature: string, uri: string, variables: EntryForm) => {
      router.push({
        pathname: `/pending/${signature}`,
        query: {
          uri,
          title: variables.title,
          body: variables.body,
          forum: variables.forum,
          author: wallet.publicKey?.toBase58(),
          postType: getPrismaPostType(variables.postType),
        },
      });
    },
    [router, wallet]
  );

  return (
    <Container maxW="3xl">
      <Heading size="md" my="9">
        Create a post
      </Heading>
      <EditorProvider
        config={{ type: "post", forum }}
        buttonLabel="Post"
        successMessage="Post created!"
        onSuccess={onSuccess}
      />
    </Container>
  );
};

export default Submit;
