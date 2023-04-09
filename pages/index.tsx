import type { NextPage } from "next";
import * as anchor from "@project-serum/anchor";
import Image from "next/image";
import Link from "next/link";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { Container, Button, Box, Heading } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Entry } from "@prisma/client";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { useState } from "react";

import { getProgram, PROGRAM_ID } from "../lib/anchor";
import { PostEditor } from "../components/editor";
import { PostListItem } from "components/components/post/listItem";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

interface CreatePostArgs {
  body: string;
}

const Home: NextPage<PageProps> = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const query = useQuery(["posts"], fetchPosts);

  // const initForumMutation = useMutation(async () => {
  //   if (!anchorWallet) {
  //     throw new Error("Wallet not connected");
  //   }

  //   const program = getProgram(connection, anchorWallet);

  //   if (!program.provider.publicKey || !program.provider.sendAndConfirm) {
  //     throw new Error("Provider not found");
  //   }

  //   const maxDepth = 14;
  //   const maxBufferSize = 64;
  //   const payer = program.provider.publicKey;
  //   const merkleTreeKeypair = anchor.web3.Keypair.generate();
  //   const merkleTree = merkleTreeKeypair.publicKey;
  //   const forumConfig = findForumConfigPda(merkleTree);
  //   const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);
  //   const lamports = await connection.getMinimumBalanceForRentExemption(space);
  //   console.log("Allocating ", space, " bytes for merkle tree");
  //   console.log(lamports, " lamports required for rent exemption");
  //   console.log(
  //     lamports / anchor.web3.LAMPORTS_PER_SOL,
  //     " SOL required for rent exemption"
  //   );
  //   const allocTreeIx = anchor.web3.SystemProgram.createAccount({
  //     lamports,
  //     space,
  //     fromPubkey: payer,
  //     newAccountPubkey: merkleTree,
  //     programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //   });

  //   const createPostIx = await program.methods
  //     .initForum(maxDepth, maxBufferSize, {
  //       // collection: { collection: anchor.web3.Keypair.generate().publicKey },
  //       none: {},
  //     })
  //     .accounts({
  //       payer,
  //       forumConfig,
  //       merkleTree,
  //       logWrapper: SPL_NOOP_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //     })
  //     .instruction();

  //   const tx = new anchor.web3.Transaction().add(allocTreeIx).add(createPostIx);
  //   tx.feePayer = payer;

  //   await program.provider.sendAndConfirm(tx, [merkleTreeKeypair], {
  //     commitment: "confirmed",
  //   });
  // });

  const createPostMutation = useMutation<void, Error, CreatePostArgs>(
    async ({ body }) => {
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
          data: { textPost: { title: "Hello World 2!", body } },
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
    }
  );

  const [body, setBody] = useState<string>("");

  return (
    <Container maxW="container.md">
      {query.data?.map((post) => (
        <PostListItem
          key={post.id}
          id={post.id}
          title={post.title!}
          body={post.content}
        />
      ))}
    </Container>
  );
};

Home.getInitialProps = async (ctx) => {
  if (typeof window === "undefined") {
    try {
      const queryClient = new QueryClient();
      await queryClient.prefetchQuery(["posts"], fetchPosts);

      return {
        dehydratedState: dehydrate(queryClient),
      };
    } catch (err) {
      console.log(err);
    }
  }

  return {
    dehydratedState: undefined,
  };
};

export default Home;

function fetchPosts(): Promise<Entry[]> {
  return fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/posts/3rmSmHQKevpDjY8WbmRq15QZ4HnpsfmmpR1FvHNH9g2T`
  ).then((res) => res.json());
}

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
