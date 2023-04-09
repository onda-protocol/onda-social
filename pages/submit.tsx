import type { NextPage } from "next";
import * as anchor from "@project-serum/anchor";
import {
  DehydratedState,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Container } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

import { getProgram, PROGRAM_ID } from "../lib/anchor";
import { PostEditor } from "../components/editor";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

interface CreatePostArgs {
  title: string;
  body: string;
}

const Submit: NextPage<PageProps> = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const router = useRouter();

  const createPostMutation = useMutation<void, Error, CreatePostArgs>(
    async ({ title, body }) => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      const program = getProgram(connection, anchorWallet);

      if (!program.provider.publicKey || !program.provider.sendAndConfirm) {
        throw new Error("Provider not found");
      }

      const forumConfig = new anchor.web3.PublicKey(
        "3rmSmHQKevpDjY8WbmRq15QZ4HnpsfmmpR1FvHNH9g2T"
      );
      const merkleTree = new anchor.web3.PublicKey(
        "RRDm68bqGqV9ZdRuoEaoWPiY71wm3wJc3VEHyozX78c"
      );

      await program.methods
        .addEntry({
          data: { textPost: { title, body } },
        })
        .accounts({
          forumConfig,
          merkleTree,
          mint: null,
          tokenAccount: null,
          metadata: null,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });
    },
    {
      async onSuccess() {
        toast.success("Post created");
        await queryClient.invalidateQueries(["posts"]);
        router.push("/");
      },
      onError(error) {
        toast.error("Failed to create post: " + error.message);
      },
    }
  );

  return (
    <Container maxW="container.sm">
      <PostEditor onSubmit={createPostMutation.mutate} />
    </Container>
  );
};

export default Submit;

function findEntryId(merkleTree: anchor.web3.PublicKey, entryIndex: number) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("entry"),
      merkleTree.toBuffer(),
      new anchor.BN(entryIndex).toBuffer("le", 8),
    ],
    PROGRAM_ID
  )[0];
}

function findForumConfigPda(merkleTree: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    PROGRAM_ID
  )[0];
}
