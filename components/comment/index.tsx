import { Comment } from "@prisma/client";
import { Box, Button } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { Markdown } from "../markdown";
import { IoChatbox } from "react-icons/io5";
import { Editor } from "../editor";

interface CommentListItemProps {
  id: string;
  body: string;
  parent: string | null;
  post: string;
  Children?: Comment[];
}

export const CommentListItem = ({
  id,
  body,
  parent,
  post,
  Children,
}: CommentListItemProps) => {
  const [reply, setReply] = useState(false);

  const toggleReply = useCallback(() => setReply((reply) => !reply), []);

  return (
    <Box>
      <Box borderWidth="1px" borderColor="gray.800" borderRadius="md" mt="4">
        <Box p="4">
          <Markdown>{body}</Markdown>
        </Box>
        <Button size="xs" leftIcon={<IoChatbox />} onClick={toggleReply}>
          Reply
        </Button>
      </Box>
      {reply && (
        <Editor
          config={{
            type: "comment",
            parent: id,
            post,
          }}
        />
      )}

      {Children && (
        <Box pl="12">
          {Children.map((comment) => (
            <CommentListItem key={comment.id} {...comment} />
          ))}
        </Box>
      )}
    </Box>
  );
};
