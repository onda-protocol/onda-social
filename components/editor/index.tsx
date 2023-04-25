import { web3 } from "@project-serum/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea, Select } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

import { sleep } from "utils/async";
import { fetchFora } from "lib/api";
import { addEntry } from "lib/anchor/actions";
import { getProgram } from "lib/anchor/provider";
import { getNameFromAddress } from "utils/profile";
import React from "react";

interface EntryForm {
  title: string;
  body: string;
  forum: string;
  url: string;
  postType: "linkPost" | "textPost";
}

type EntryConfig =
  | {
      type: "post";
      forum?: string;
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
  onRequestClose?: () => void;
  onUpdate?: (id: string, nonce: string, body: string) => void;
}

export const Editor = ({
  buttonLabel,
  invalidateQueries,
  placeholder,
  redirect,
  successMessage,
  config,
  onRequestClose,
  onUpdate,
}: EditorProps) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const router = useRouter();

  const methods = useForm<EntryForm>({
    defaultValues: {
      title: "",
      body: "",
      postType: "textPost",
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
        switch (data.postType) {
          case "linkPost": {
            dataArgs = {
              linkPost: {
                title: data.title,
                url: data.url,
              },
            };
            break;
          }

          case "textPost": {
            dataArgs = { textPost: { title: data.title, body: data.body } };
            break;
          }

          default: {
            throw new Error("Invalid post type");
          }
        }
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

        if (onRequestClose) {
          onRequestClose();
        }

        if (data && onUpdate) {
          onUpdate(...data, variables.body);
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
        <Select
          {...methods.register("postType", {
            required: true,
          })}
        >
          <option value="textPost">Text Post</option>
          <option value="linkPost">Link Post</option>
        </Select>
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
        backgroundColor="#090A20"
        {...methods.register("body", { required: true })}
      />
      <Box display="flex" mt="2" justifyContent="right">
        {onRequestClose && (
          <Button
            isDisabled={mutation.isLoading}
            variant="ghost"
            onClick={onRequestClose}
            mr="2"
          >
            Cancel
          </Button>
        )}
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
