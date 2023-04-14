import { web3 } from "@project-serum/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea, Select } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

import { sleep } from "utils/async";
import { SerializedCommentNested, fetchFora } from "lib/api";
import { addEntry } from "lib/anchor/actions";
import { getProgram } from "lib/anchor/provider";
import { getNameFromAddress } from "utils/profile";
import React from "react";

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
  queryKey?: string[];
  redirect?: string;
  successMessage?: string;
  config: EntryConfig;
}

export const Editor = ({
  buttonLabel,
  invalidateQueries,
  queryKey,
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

  const mutation = useMutation<[string, string] | void, Error, EntryForm>(
    async (data) => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      const program = getProgram(connection, anchorWallet);

      if (!program.provider.publicKey || !program.provider.sendAndConfirm) {
        throw new Error("Provider not found");
      }

      const forumId = config.type === "comment" ? config.forum : data.forum;
      const forum = await queryClient
        .fetchQuery(["fora"], fetchFora)
        .then((fora) => fora.find((forum) => forum.id === forumId));

      if (!forum) {
        throw new Error("Forum not found");
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

      return addEntry(connection, anchorWallet, {
        data: dataArgs,
        forumId: forum.id,
        forumConfig: forum.config,
        collection: forum.collection,
      });
    },
    {
      async onSuccess(data, variables) {
        methods.reset();

        if (successMessage) {
          toast.success(successMessage);
        }

        if (data && config.type === "comment" && config.parent && queryKey) {
          queryClient.setQueryData<SerializedCommentNested[]>(
            queryKey,
            (comments) => {
              console.log("comments: ", comments);
              if (comments) {
                comments.forEach((c) => {
                  if (config.parent === c.id) {
                    c.Children = [
                      ...c.Children,
                      {
                        id: data[0],
                        author: anchorWallet?.publicKey?.toBase58() || "",
                        createdAt: BigInt(
                          Math.floor(Date.now() / 1000)
                        ).toString(),
                        editedAt: null,
                        parent: config.parent,
                        post: config.post,
                        body: variables.body,
                        likes: "0",
                        nonce: data[1],
                        Children: [],
                      },
                    ];
                  }
                });
                return [...comments];
              }
            }
          );
        }

        if (invalidateQueries) {
          await sleep(2000);
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
