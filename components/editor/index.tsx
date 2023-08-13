import React, { useEffect } from "react";
import { web3 } from "@project-serum/anchor";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Box, Button, Input, Textarea, Select } from "@chakra-ui/react";
import { useSessionWallet } from "@gumhq/react-sdk";
import { IoDocumentText, IoImage, IoLink } from "react-icons/io5";
import { Controller, useForm, useWatch } from "react-hook-form";

import { fetchFora, fetchForum } from "lib/api";
import { addEntry } from "lib/anchor/actions";
import { ContentType, upload } from "lib/bundlr";
import { RadioCardMenu } from "components/input";
import { ImagePicker } from "components/input/imagePicker";
import { getOrCreateSession } from "lib/gum";
import { useRouter } from "next/router";

export interface EntryForm {
  title: string;
  body: string;
  image: File | null;
  forum: string;
  url: string;
  postType: "textPost" | "imagePost" | "linkPost";
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
  const router = useRouter();
  const forum = router.query.o as string | undefined;
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const sessionWallet = useSessionWallet();
  const queryClient = useQueryClient();
  const foraQuery = useQuery(["fora"], fetchFora, {
    enabled: Boolean(config.type === "post"),
  });

  const methods = useForm<EntryForm>({
    defaultValues: {
      title: "",
      body: "",
      image: null,
      forum: forum || "",
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

    if (forum) {
      setValue("forum", forum);
    } else if (config.forum) {
      setValue("forum", config.forum);
    }
  }, [methods.setValue, forum, config.forum]);

  useEffect(() => {
    if (foraQuery.data) {
      foraQuery.data.forEach((forum) =>
        queryClient.setQueryData(["forum", forum.namespace], forum)
      );
    }
  }, [queryClient, foraQuery.data]);

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

      const forumNamespace =
        config.type === "comment" ? config.forum : data.forum;
      const forum = await queryClient.fetchQuery(
        ["forum", forumNamespace],
        () => fetchForum(forumNamespace),
        {
          staleTime: 300_000,
        }
      );

      if (!forum) {
        throw new Error("Forum not found");
      }

      let uri: string;
      let dataArgs = {};

      if (config.type === "post") {
        switch (data.postType) {
          case "linkPost": {
            uri = data.url;
            dataArgs = {
              linkPost: {
                uri,
                title: data.title,
              },
            };
            break;
          }

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
        forum,
        data: dataArgs,
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

      case "linkPost": {
        return (
          <Input mt="4" placeholder="Enter url" {...methods.register("url")} />
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
      <Controller
        name="forum"
        control={methods.control}
        rules={{ required: true }}
        render={({ field }) => (
          <SelectForum
            {...field}
            options={foraQuery.data}
            defaultValue={forum || config.forum}
          />
        )}
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
                {
                  label: "Link Post",
                  value: "linkPost",
                  icon: <IoLink size="1.25em" />,
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
  {
    options: Awaited<ReturnType<typeof fetchFora>>;
    selected: string;
  } & React.ComponentPropsWithoutRef<typeof Select>
>(function SelectForum({ options, selected, ...other }, ref) {
  return (
    <Select mt="6" placeholder="Choose a community" ref={ref} {...other}>
      {options?.map((forum) =>
        forum.namespace ? (
          <option key={forum.id} value={forum.namespace!}>
            {forum.displayName}
          </option>
        ) : null
      )}
    </Select>
  );
});

export const DummyCommentEditor = () => (
  <Box>
    <Textarea
      isDisabled
      mt="2"
      placeholder="Loading..."
      minHeight="100px"
      backgroundColor="#090A20"
    />
    <Box display="flex" mt="2" justifyContent="right">
      <Button isDisabled variant="solid" type="submit" cursor="pointer">
        Submit
      </Button>
    </Box>
  </Box>
);
