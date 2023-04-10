import * as anchor from "@project-serum/anchor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

import { getProgram, PROGRAM_ID } from "../../lib/anchor";

interface EntryForm {
  title: string;
  body: string;
}

type EntryConfig =
  | {
      type: "post";
      // forum: string;
    }
  | {
      type: "comment";
      post: string;
      parent?: string;
    };

interface EditorProps {
  invalidateQueries?: string[];
  redirect?: string;
  successMessage: string;
  config: EntryConfig;
}

export const Editor = ({
  invalidateQueries,
  redirect,
  successMessage,
  config,
}: EditorProps) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const router = useRouter();

  const methods = useForm<EntryForm>({
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const mutation = useMutation<void, Error, EntryForm>(
    async ({ title, body }) => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      const program = getProgram(connection, anchorWallet);

      if (!program.provider.publicKey || !program.provider.sendAndConfirm) {
        throw new Error("Provider not found");
      }

      const forumConfig = new anchor.web3.PublicKey(
        process.env.NEXT_PUBLIC_FORUM as string
      );
      const merkleTree = new anchor.web3.PublicKey(
        process.env.NEXT_PUBLIC_MERKLE_TREE as string
      );

      let data = {};

      if (config.type === "post") {
        data = { textPost: { title, body } };
      } else {
        data = {
          comment: { post: config.post, parent: config.parent, body },
        };
      }

      await program.methods
        .addEntry({ data })
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
        toast.success(successMessage);

        if (invalidateQueries) {
          await queryClient.invalidateQueries(invalidateQueries);
        }

        if (redirect) {
          router.push(redirect);
        }
      },
      onError(error) {
        toast.error("Failed to submit: " + error.message);
      },
    }
  );

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => mutation.mutate(data))}
    >
      {config.type === "post" && (
        <Input
          mt="6"
          {...methods.register("title", {
            required: true,
          })}
        />
      )}
      <Textarea
        mt="2"
        placeholder="Hello world"
        {...methods.register("body", { required: true })}
      />
      <Box display="flex" mt="2" justifyContent="right">
        <Button isLoading={mutation.isLoading} type="submit">
          Submit
        </Button>
      </Box>
    </Box>
  );
};
