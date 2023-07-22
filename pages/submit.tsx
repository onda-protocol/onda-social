import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Container, Heading } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";

import { fetchUser } from "lib/api";
import { Editor, EntryForm } from "components/editor";

const Submit: NextPage = () => {
  const router = useRouter();
  const wallet = useWallet();
  const queryClient = useQueryClient();
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
      const user = await queryClient.getQueryData([
        "user",
        wallet.publicKey?.toBase58(),
      ]);

      router.push(`/pending/${signature}`, {
        query: {
          uri,
          title: variables.title,
          body: variables.body,
          forum: variables.forum,
          author: JSON.stringify(
            user ?? {
              id: wallet.publicKey?.toBase58(),
            }
          ),
          postType: variables.postType,
        },
      });
    },
    [queryClient, router, wallet]
  );

  return (
    <Container maxW="3xl">
      <Heading size="md" my="9">
        Create a post
      </Heading>
      <Editor
        config={{ type: "post", forum }}
        invalidateQueries={["posts"]}
        redirect="/"
        buttonLabel="Post"
        successMessage="Post created!"
        onSuccess={onSuccess}
      />
    </Container>
  );
};

export default Submit;
