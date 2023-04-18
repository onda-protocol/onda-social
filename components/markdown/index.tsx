import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import { Box } from "@chakra-ui/react";

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      components={ChakraUIRenderer({
        blockquote: (props) => (
          <Box
            as="blockquote"
            mt="4"
            mb="6"
            p="4"
            pb="2"
            borderColor="gray.800"
            borderLeftWidth="2px"
            {...props}
          />
        ),
      })}
    >
      {children}
    </ReactMarkdown>
  );
};
