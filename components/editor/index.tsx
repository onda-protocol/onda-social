import React, { useEffect } from "react";
import { web3 } from "@project-serum/anchor";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Forum, PostType } from "@prisma/client";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea, Select } from "@chakra-ui/react";
import { useSessionWallet } from "@gumhq/react-sdk";
import { IoDocumentText, IoImage } from "react-icons/io5";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/router";
import { randomBytes } from "crypto";

import { sleep } from "utils/async";
import { getPrismaPostType } from "utils/format";
import { SerializedForum, fetchFora } from "lib/api";
import { addEntry } from "lib/anchor/actions";
import { getNameFromAddress, getProfiles } from "utils/profile";
import { ContentType, upload } from "lib/bundlr";
import { RadioCardMenu } from "components/input";
import { ImagePicker } from "components/input/imagePicker";
import { getOrCreateSession } from "lib/gum";

export interface EntryForm {
  title: string;
  body: string;
  image: File | null;
  forum: string;
  url: string;
  postType: "textPost" | "imagePost";
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
  onSuccess?: (signature: string, uri: string, variables: EntryForm) => void;
}

export const Editor = ({
  buttonLabel,
  placeholder,
  successMessage,
  config,
  onRequestClose,
  onSuccess,
}: EditorProps) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const sessionWallet = useSessionWallet();
  const queryClient = useQueryClient();

  const methods = useForm<EntryForm>({
    defaultValues: {
      title: "",
      body: "",
      image: null,
      forum: "",
      postType: "textPost",
    },
  });
  const postType = useWatch({
    control: methods.control,
    name: "postType",
  });

  // Async set forum value because next router is not available on mount
  useEffect(() => {
    const setValue = methods.setValue;

    if (config.forum) {
      setValue("forum", config.forum);
    }
  }, [methods.setValue, config.forum]);

  const mutation = useMutation<
    { signature: string; uri: string },
    Error,
    EntryForm
  >(
    async (data) => {
      if (!anchorWallet || !wallet) {
        throw new Error("Wallet not connected");
      }

      const session = await getOrCreateSession(sessionWallet);

      const forumId = config.type === "comment" ? config.forum : data.forum;
      const forum = await queryClient
        .fetchQuery(["fora"], fetchFora)
        .then((fora) => fora.find((forum) => forum.id === forumId));

      if (!forum) {
        throw new Error("Forum not found");
      }

      let uri: string;
      let dataArgs = {};

      if (config.type === "post") {
        switch (data.postType) {
          // case "linkPost": {
          //   dataArgs = {
          //     linkPost: {
          //       title: data.title,
          //       url: data.url,
          //     },
          //   };
          //   break;
          // }

          case "textPost": {
            uri = await upload(wallet, session, data.body, "application/json");
            dataArgs = { textPost: { title: data.title, uri } };
            break;
          }

          case "imagePost": {
            if (data.image === null) {
              throw new Error("Image required");
            }
            const buffer = Buffer.from(await data.image.arrayBuffer());
            uri = await upload(
              wallet,
              session,
              buffer,
              data.image.type as ContentType
            );
            dataArgs = { imagePost: { title: data.title, uri } };
            break;
          }

          default: {
            throw new Error("Invalid post type");
          }
        }
      } else {
        uri = await upload(wallet, session, data.body, "application/json");
        dataArgs = {
          comment: {
            uri,
            post: new web3.PublicKey(config.post),
            parent: config.parent ? new web3.PublicKey(config.parent) : null,
          },
        };
      }

      const signature = await addEntry(connection, anchorWallet, session, {
        data: dataArgs,
        forumId: forum.id,
        forumConfig: forum.config,
        collections: forum.collections,
      });

      return {
        uri,
        signature,
      };
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

        if (onSuccess) {
          onSuccess(data.signature, data.uri, variables);
        }

        // {
        //   id: data.entryId,
        //   nonce: data.nonce,
        //   title: variables.title,
        //   nsfw: false,
        //   body: variables.body,
        //   uri: data.uri,
        //   postType: getPrismaPostType(variables.postType),
        //   author: wallet.publicKey!.toBase58(),
        //   Forum: data.forum,
        // }
      },
      onError(error) {
        // @ts-ignore
        console.log(error.logs);
        toast.error("Failed to submit: " + error.message);
      },
    }
  );

  if (config.type === "comment") {
    return (
      <Box
        noValidate
        as="form"
        onSubmit={methods.handleSubmit((data) => mutation.mutate(data))}
      >
        <Textarea
          mt="2"
          placeholder={placeholder}
          minHeight="100px"
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
          <Button
            isLoading={mutation.isLoading}
            variant="solid"
            type="submit"
            cursor="pointer"
          >
            {buttonLabel || "Submit"}
          </Button>
        </Box>
      </Box>
    );
  }

  function renderInputs() {
    switch (postType) {
      case "textPost": {
        return (
          <Textarea
            mt="4"
            placeholder={placeholder || "Text"}
            minHeight={config.type === "post" ? "200px" : "100px"}
            backgroundColor="#090A20"
            {...methods.register("body", { required: true })}
          />
        );
      }

      case "imagePost": {
        return (
          <Controller
            control={methods.control}
            name="image"
            render={({ field }) => (
              <ImagePicker
                name={field.name}
                // @ts-ignore
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        );
      }
    }
  }

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => mutation.mutate(data))}
    >
      <SelectForum
        defaultValue={config.forum}
        {...methods.register("forum", {
          required: true,
        })}
      />
      <Box my="6">
        <Controller
          control={methods.control}
          name="postType"
          render={({ field }) => (
            <RadioCardMenu
              name={field.name}
              options={[
                {
                  label: "Text Post",
                  value: "textPost",
                  icon: <IoDocumentText size="1.25em" />,
                },
                {
                  label: "Image Post",
                  value: "imagePost",
                  icon: <IoImage size="1.25em" />,
                },
              ]}
              // @ts-ignore
              defaultValue={field.value}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
        <Box
          borderColor="whiteAlpha.100"
          borderLeftWidth="1px"
          borderRightWidth="1px"
          borderBottomWidth="1px"
          p="6"
        >
          <Input
            placeholder="Title"
            {...methods.register("title", {
              required: true,
            })}
          />
          {renderInputs()}
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
            <Button
              isLoading={mutation.isLoading}
              variant="solid"
              minWidth="100px"
              type="submit"
              cursor="pointer"
            >
              {buttonLabel || "Submit"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const SelectForum = React.forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<typeof Select>
>(function SelectForum(props, ref) {
  return (
    <Select mt="6" placeholder="Choose a community" ref={ref} {...props}>
      {getProfiles().map((forum) => (
        <option key={forum.id} value={forum.id}>
          {getNameFromAddress(forum.id)}
        </option>
      ))}
    </Select>
  );
});
