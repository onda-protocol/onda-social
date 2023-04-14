import { web3 } from "@project-serum/anchor";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea, Select } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

import { findMetadataPda } from "utils/pda";
import { fetchAllAccounts } from "utils/web3";
import { getProgram } from "lib/anchor/provider";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { getNameFromAddress, getProfiles } from "utils/profile";
import React from "react";
import { SerializedForum, fetchFora } from "lib/api";

interface EntryForm {
  title: string;
  body: string;
  forum: string;
}

type EntryConfig =
  | {
      type: "post";
    }
  | {
      type: "comment";
      post: string;
      forum: string;
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
    async (data) => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      const program = getProgram(connection, anchorWallet);

      if (!program.provider.publicKey || !program.provider.sendAndConfirm) {
        throw new Error("Provider not found");
      }

      let dataArgs = {};

      if (config.type === "post") {
        dataArgs = { textPost: { title: data.title, body: data.body } };
      } else {
        dataArgs = {
          comment: {
            post: new web3.PublicKey(config.post),
            parent: config.parent ? new web3.PublicKey(config.parent) : null,
            body: data.body,
          },
        };
      }

      const forumId = config.type === "comment" ? config.forum : data.forum;
      const forum = queryClient
        .getQueryData<SerializedForum[]>(["fora"])
        ?.find((forum) => forum.id === forumId);

      if (!forum) {
        throw new Error("Forum not found");
      }

      const merkleTree = new web3.PublicKey(forum.id);
      const forumConfig = new web3.PublicKey(forum.config);
      const collection = forum.collection
        ? new web3.PublicKey(forum.collection)
        : undefined;

      let mint, metadata, tokenAccount;

      if (collection) {
        [mint, metadata, tokenAccount] = await fetchTokenAccounts(
          connection,
          anchorWallet.publicKey,
          collection
        );
      }

      await program.methods
        .addEntry(dataArgs)
        .accounts({
          forumConfig,
          merkleTree,
          mint,
          tokenAccount,
          metadata,
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
        <SelectForum
          {...methods.register("forum", {
            required: true,
          })}
        />
      )}
      {config.type === "post" && (
        <Input
          mt="6"
          placeholder="Title"
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
        <Button isLoading={mutation.isLoading} variant="solid" type="submit">
          {buttonLabel || "Submit"}
        </Button>
      </Box>
    </Box>
  );
};

const SelectForum = React.forwardRef<HTMLSelectElement>(function SelectForum(
  props,
  ref
) {
  const query = useQuery(["fora"], fetchFora);

  return (
    <Select mt="6" placeholder="Choose a community" ref={ref} {...props}>
      {query.data?.map((forum) => (
        <option key={forum.id} value={forum.id}>
          {getNameFromAddress(forum.id)}
        </option>
      ))}
    </Select>
  );
});

async function fetchTokenAccounts(
  connection: web3.Connection,
  owner: web3.PublicKey,
  collection: web3.PublicKey
) {
  const tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
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
    .filter((metadata): metadata is NonNullable<Metadata> => metadata !== null);

  console.log("metadata: ", metadata);
  const selectedMetadataAccount = metadata.find((metadata) =>
    metadata.collection?.key.equals(collection)
  );
  const selectedMintAddress = selectedMetadataAccount?.mint;
  console.log("selectedMetadataAccount: ", selectedMetadataAccount);

  if (!selectedMintAddress) {
    throw new Error("Unahthorized");
  }

  const selectedMetadataPda = findMetadataPda(selectedMetadataAccount.mint);
  const selectedTokenAddress = decodedTokenAccounts.find((value) =>
    value.mint.equals(selectedMetadataAccount.mint)
  )?.pubkey;

  if (!selectedTokenAddress) {
    throw new Error("Token account not found");
  }

  return [
    selectedMintAddress,
    selectedMetadataPda,
    selectedTokenAddress,
  ] as const;
}
