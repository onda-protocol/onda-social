import { useRouter } from "next/router";
import React, { useEffect, forwardRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Input,
  Text,
  Textarea,
  Select,
  Flex,
  Link as ChakraLink,
} from "@chakra-ui/react";
import toast from "react-hot-toast";
import {
  Control,
  Controller,
  useController,
  useForm,
  useWatch,
} from "react-hook-form";
import { IoDocumentText, IoInformationCircle, IoLink } from "react-icons/io5";

import { SerializedForum, fetchFora, signAndConfirmTransaction } from "lib/api";
import {
  EntryDataArgs,
  CommentArgs,
  TextPostArgs,
  LinkPostArgs,
} from "lib/api/types";
import { RadioCardMenu } from "components/input";
import { AuthStatus, useAuth } from "components/providers/auth";
import { Markdown } from "components/markdown";
// import { ImagePicker } from "components/input/imagePicker";

export interface EntryForm {
  title: string;
  body: string;
  image: File | null;
  forum: string;
  url: string;
  flair?: string;
  postType: "textPost" | "linkPost";
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
  const auth = useAuth();

  const queryClient = useQueryClient();
  const foraQuery = useQuery(
    ["fora"],
    async () => {
      const fora = await fetchFora();

      fora.forEach((forum) => {
        queryClient.setQueryData(["forum", forum.id], forum);
        queryClient.setQueryData(
          ["forum", "namespace", forum.namespace],
          forum
        );
      });

      return fora;
    },
    {
      enabled: Boolean(config.type === "post"),
    }
  );

  const methods = useForm<EntryForm>({
    defaultValues: {
      title: "",
      body: "",
      image: null,
      forum: forum || "",
      flair: undefined,
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

  const mutation = useMutation<
    { signature: string; uri: string },
    Error,
    EntryForm
  >(
    async (data) => {
      if (!auth.address) {
        throw new Error("Wallet not connected");
      }

      if (!auth.signTransaction) {
        throw new Error("Wallet not connected");
      }

      let dataArgs: EntryDataArgs;

      if (config.type === "comment") {
        const comment: CommentArgs = {
          type: "comment",
          author: auth.address,
          forum: config.forum,
          parent: config.parent,
          post: config.post,
          body: data.body,
        };
        dataArgs = comment;
      } else {
        switch (data.postType) {
          case "textPost": {
            const textPost: TextPostArgs = {
              type: "textPost",
              author: auth.address,
              forum: data.forum,
              title: data.title,
              body: data.body,
              flair: data.flair ?? null,
            };
            dataArgs = textPost;
            break;
          }

          case "linkPost": {
            const linkPost: LinkPostArgs = {
              type: "linkPost",
              author: auth.address,
              forum: data.forum,
              title: data.title,
              url: data.url,
              flair: data.flair ?? null,
            };
            dataArgs = linkPost;
            break;
          }

          default: {
            throw new Error("Invalid post type");
          }
        }
      }
      console.log("dataArgs: ", dataArgs);

      const response = await signAndConfirmTransaction(connection, auth, {
        method: "addEntry",
        data: dataArgs,
      });

      return {
        uri: response.uri!,
        signature: response.txId,
      };
    },
    {
      async onSuccess(data, variables) {
        methods.reset();

        if (onRequestClose) {
          onRequestClose();
        }

        if (onSuccess) {
          onSuccess(data.signature, data.uri, variables);
        }

        if (successMessage) {
          toast.success(successMessage);
        }
      },
      onError(err) {
        console.log(err);
        // @ts-ignore
        console.log(err.logs);
        toast.error("Failed to submit: " + err.message);
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
          backgroundColor="blackAlpha.100"
          {...methods.register("body", {
            required: true,
            validate(value) {
              if (Buffer.from(value, "utf-8").byteLength > 100_000) {
                return "Must be less than 100 KiB";
              }
            },
          })}
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
            isDisabled={auth.status !== AuthStatus.AUTHENTICATED}
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
          <Controller
            control={methods.control}
            name="body"
            rules={{ required: true }}
            render={({ field }) => (
              <MarkdownEditor
                placeholder={placeholder}
                size="lg"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        );
      }

      // case "imagePost": {
      //   return (
      //     <Controller
      //       control={methods.control}
      //       name="image"
      //       render={({ field }) => (
      //         <ImagePicker
      //           name={field.name}
      //           // @ts-ignore
      //           value={field.value}
      //           onChange={field.onChange}
      //         />
      //       )}
      //     />
      //   );
      // }

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
                // {
                //   label: "Image Post",
                //   value: "imagePost",
                //   icon: <IoImage size="1.25em" />,
                // },
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
          <Box display="flex" mt="2" alignItems="center" justifyContent="right">
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
            {config.type === "post" && foraQuery.data && (
              <Box width="200px" pr="2">
                <SelectFlair fora={foraQuery.data} control={methods.control} />
              </Box>
            )}
            <Button
              isDisabled={auth.status !== AuthStatus.AUTHENTICATED}
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
    options: SerializedForum[];
    selected: string;
  } & React.ComponentPropsWithoutRef<typeof Select>
>(function SelectForum({ options, selected, ...other }, ref) {
  return (
    <Select mt="6" placeholder="Choose a community" ref={ref} {...other}>
      {options?.map((forum) =>
        forum.namespace ? (
          <option key={forum.id} value={forum.id}>
            {forum.displayName}
          </option>
        ) : null
      )}
    </Select>
  );
});

interface SelectFlairProps {
  fora: SerializedForum[];
  control: Control<EntryForm>;
}

const SelectFlair = ({ fora, control }: SelectFlairProps) => {
  const selectedForum = useWatch<EntryForm, "forum">({
    control,
    name: "forum",
  });
  const flairControl = useController<EntryForm, "flair">({
    control,
    name: "flair",
    rules: { required: false },
  });

  const forum = fora?.find((f) => f.id === selectedForum);

  useEffect(() => {
    if (selectedForum) {
      flairControl.field.onChange(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedForum]);

  if (!forum?.Flair) return null;

  return (
    <Select
      placeholder="Select Flair"
      {...flairControl.field}
      onChange={(e) => {
        console.log(e.target.value);
        flairControl.field.onChange(e.target.value);
      }}
    >
      {forum.Flair?.map((flair) => (
        <option key={flair.id} value={flair.name}>
          {flair.name}
        </option>
      ))}
    </Select>
  );
};

interface MarkdownEditorProps {
  placeholder?: string;
  value: string;
  size: "md" | "lg";
  onChange: (value: string) => void;
}

const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  function MarkdownEditor({ placeholder, size, value, onChange }, ref) {
    const [previewMode, setPreviewMode] = useState(false);

    return (
      <Box
        display="flex"
        flexDirection="column"
        mt="2"
        borderRadius="md"
        border="1px solid"
        borderColor="inherit"
        outline="2px solid transparent"
        _hover={{
          borderColor: "var(--chakra-colors-whiteAlpha-400)",
        }}
        _focusWithin={{
          borderColor: "#63b3ed",
          boxShadow: "0 0 0 1px #63b3ed",
          outline: "2px solid var(--chakra-ring-color)",
          zIndex: 1,
        }}
      >
        {previewMode && (
          <Box px="4" py="2" minHeight={size === "lg" ? "200px" : "100px"}>
            <Markdown>{value ?? ""}</Markdown>
          </Box>
        )}
        <Textarea
          ref={ref}
          display={previewMode ? "none" : "block"}
          placeholder={placeholder}
          minHeight={size === "lg" ? "200px" : "100px"}
          borderRadius={0}
          border="none"
          outline="none"
          _focus={{
            outline: 0,
            boxShadow: "none",
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Box
          flex={0}
          backgroundColor="blackAlpha.400"
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          borderBottomRadius="md"
          padding="3"
        >
          <Flex align="center" justify="space-between">
            <ChakraLink
              display="flex"
              alignItems="center"
              href="https://commonmark.org/help/"
              target="_blank"
            >
              <IoInformationCircle
                style={{
                  display: "inline",
                  marginRight: "var(--chakra-space-1)",
                }}
              />
              <Text as="span">Markdown</Text>
            </ChakraLink>
            <Button
              size="sm"
              variant={previewMode ? "primary" : "solid"}
              onClick={() => {
                setPreviewMode((v) => !v);
              }}
            >
              {previewMode ? "Write" : "Preview"}
            </Button>
          </Flex>
        </Box>
      </Box>
    );
  }
);
