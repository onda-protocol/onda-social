import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";

export const Markdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown components={ChakraUIRenderer()}>{children}</ReactMarkdown>
  );
};
