import { web3 } from "@project-serum/anchor";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

import { findMetadataPda } from "utils/pda";
import { fetchAllAccounts } from "utils/web3";
import { getProgram } from "lib/anchor/provider";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

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
      parent: string | null;
    };

interface EditorProps {
  buttonLabel?: string;
  placeholder?: string;
  invalidateQueries?: string[];
  redirect?: string;
  successMessage?: string;
  config: EntryConfig;
}

export const Editor = ({
  buttonLabel,
  invalidateQueries,
  placeholder,
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

      const collection = new web3.PublicKey(
        "EotJ4wYtYQUbx6E2Tn5aAbsr79KBFRcwj5usriv2Xj7i"
      );
      const forumConfig = new web3.PublicKey(
        "FghMS8HrXVt9RsXwfLCVydQQKhz5Ce3StjQcvscSyWcy"
      );
      const merkleTree = new web3.PublicKey(
        "HrUvs6YZgs1LbvFbF6gMrzC7Z1qobXsVuLjngE7EB1TH"
      );

      let data = {};

      const tokenAccounts = await connection.getTokenAccountsByOwner(
        program.provider.publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );
      const decodedTokenAccounts = tokenAccounts.value.map((value) => ({
        ...AccountLayout.decode(value.account.data),
        pubkey: value.pubkey,
      }));
      const metadataPdas = decodedTokenAccounts.map((account) =>
        findMetadataPda(account.mint)
      );
      const metadataAccounts = await fetchAllAccounts(connection, metadataPdas);
      const metadata = metadataAccounts
        .map((account) => {
          try {
            return Metadata.fromAccountInfo(account)[0];
          } catch (err) {
            console.log("err: ", err);
            return null;
          }
        })
        .filter(
          (metadata): metadata is NonNullable<Metadata> => metadata !== null
        );

      console.log("metadata: ", metadata);
      const selectedMetadataAccount = metadata.find((metadata) =>
        metadata.collection?.key.equals(collection)
      );
      console.log("selectedMetadataAccount: ", selectedMetadataAccount);

      if (!selectedMetadataAccount) {
        throw new Error("Unahthorized");
      }

      const selectedMetadataPda = findMetadataPda(selectedMetadataAccount.mint);
      const selectedTokenAddress = decodedTokenAccounts.find((value) =>
        value.mint.equals(selectedMetadataAccount.mint)
      )?.pubkey;

      if (!selectedTokenAddress) {
        throw new Error("Token account not found");
      }

      if (config.type === "post") {
        data = { textPost: { title, body } };
      } else {
        data = {
          comment: {
            post: new web3.PublicKey(config.post),
            parent: config.parent ? new web3.PublicKey(config.parent) : null,
            body,
          },
        };
      }

      await program.methods
        .addEntry(data)
        .accounts({
          forumConfig,
          merkleTree,
          mint: selectedMetadataAccount.mint,
          tokenAccount: selectedTokenAddress,
          metadata: selectedMetadataPda,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" });
    },
    {
      async onSuccess() {
        if (successMessage) {
          toast.success(successMessage);
        }

        if (invalidateQueries) {
          await queryClient.invalidateQueries(invalidateQueries);
        }

        if (redirect) {
          router.push(redirect);
        }
      },
      onError(error) {
        // @ts-ignore
        console.log(error.logs);
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
        placeholder={placeholder}
        {...methods.register("body", { required: true })}
      />
      <Box display="flex" mt="2" justifyContent="right">
        <Button
          size="sm"
          isLoading={mutation.isLoading}
          variant="solid"
          type="submit"
        >
          {buttonLabel || "Submit"}
        </Button>
      </Box>
    </Box>
  );
};
