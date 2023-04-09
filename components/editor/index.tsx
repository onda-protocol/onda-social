import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { chakra, Box, Button, Input } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { $getRoot, $getSelection } from "lexical";

interface PostForm {
  title: string;
  body: string;
}

interface EditorProps {
  onSubmit: (data: PostForm) => void;
}

export const PostEditor = ({ onSubmit }: EditorProps) => {
  const methods = useForm<PostForm>({
    defaultValues: {
      title: "",
      body: "",
    },
  });

  return (
    <Box noValidate as="form" onSubmit={methods.handleSubmit(onSubmit)}>
      <Input
        mb="2"
        mt="6"
        {...methods.register("title", {
          required: true,
        })}
      />
      <Editor />
      <Box>
        <Button type="submit">Submit</Button>
      </Box>
    </Box>
  );
};

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    console.log(root, selection);
  });
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error) {
  console.error(error);
}

const ChakraContentEditable = chakra(ContentEditable);

const editorConfig = {
  namespace: "editor",
  // theme,
  onError,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    AutoLinkNode,
    LinkNode,
  ],
};

function Editor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <RichTextPlugin
        contentEditable={
          <ChakraContentEditable
            w="100%"
            maxH="60vh"
            h="30ch"
            overflowY="scroll"
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.700"
            p={2}
          />
        }
        placeholder={<div>Enter some text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
      <ListPlugin />
      <LinkPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </LexicalComposer>
  );
}
