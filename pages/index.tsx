import type { NextPage } from "next";
import * as anchor from "@project-serum/anchor";
import {
  QueryClient,
  DehydratedState,
  dehydrate,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { Box } from "@chakra-ui/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  getConcurrentMerkleTreeAccountSize,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

import { getProgram, PROGRAM_ID } from "lib/anchor/provider";
import { fetchPosts } from "lib/api";
import { PostListItem } from "components/post/listItem";
import { Sidebar } from "components/layout/sidebar";
import { GridLayout } from "components/layout";

interface PageProps {
  dehydratedState: DehydratedState | undefined;
}

const Home: NextPage<PageProps> = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const query = useQuery(["posts"], fetchPosts);

  const initForumMutation = useMutation(async () => {
    if (!anchorWallet) {
      throw new Error("Wallet not connected");
    }

    const program = getProgram(connection, anchorWallet);

    if (!program.provider.publicKey || !program.provider.sendAndConfirm) {
      throw new Error("Provider not found");
    }

    const maxDepth = 14;
    const maxBufferSize = 64;
    const payer = program.provider.publicKey;
    const merkleTreeKeypair = anchor.web3.Keypair.generate();
    const merkleTree = merkleTreeKeypair.publicKey;
    const forumConfig = findForumConfigPda(merkleTree);
    const space = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);
    const lamports = await connection.getMinimumBalanceForRentExemption(space);
    console.log("Allocating ", space, " bytes for merkle tree");
    console.log(lamports, " lamports required for rent exemption");
    console.log(
      lamports / anchor.web3.LAMPORTS_PER_SOL,
      " SOL required for rent exemption"
    );
    const allocTreeIx = anchor.web3.SystemProgram.createAccount({
      lamports,
      space,
      fromPubkey: payer,
      newAccountPubkey: merkleTree,
      programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    });

    const initIx = await program.methods
      .initForum(maxDepth, maxBufferSize, {
        collection: {
          address: new anchor.web3.PublicKey(
            "EotJ4wYtYQUbx6E2Tn5aAbsr79KBFRcwj5usriv2Xj7i"
          ),
        },
      })
      .accounts({
        payer,
        forumConfig,
        merkleTree,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .instruction();

    const tx = new anchor.web3.Transaction().add(allocTreeIx).add(initIx);
    tx.feePayer = payer;

    try {
      await program.provider.sendAndConfirm(tx, [merkleTreeKeypair], {
        commitment: "confirmed",
      });
    } catch (err) {
      // @ts-ignore
      console.log(err.logs);
      throw err;
    }

    console.log("Forum initialized");
    console.log("forumConfig: ", forumConfig.toBase58());
    console.log("merkleTree: ", merkleTree.toBase58());
  });

  return (
    <GridLayout
      leftColumn={
        <Box mt="6" borderTop="1px" borderColor="gray.800" borderRadius="md">
          {query.data?.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </Box>
      }
      rightColumn={<Sidebar />}
    />
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

function findForumConfigPda(merkleTree: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    PROGRAM_ID
  )[0];
}
