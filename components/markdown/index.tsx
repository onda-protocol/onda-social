import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import { Box, Heading, Image } from "@chakra-ui/react";
import { useMemo } from "react";

export const Markdown = ({
  children,
  preview,
}: {
  children: string;
  preview?: boolean;
}) => {
  console.log("Markdown", children);

  const components = useMemo(() => {
    return ChakraUIRenderer({
      h1: (props) => (
        <Heading as="h1" fontSize="2xl" mt="6" mb="4" {...props} />
      ),
      h2: (props) => <Heading as="h2" fontSize="xl" mt="6" mb="4" {...props} />,
      h3: (props) => <Heading as="h3" fontSize="lg" mt="6" mb="4" {...props} />,
      h4: (props) => <Heading as="h4" fontSize="md" mt="6" mb="4" {...props} />,
      h5: (props) => <Heading as="h5" fontSize="sm" mt="6" mb="4" {...props} />,
      h6: (props) => <Heading as="h6" fontSize="xs" mt="6" mb="4" {...props} />,
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
      img: preview
        ? () => null
        : (props) => <Image {...props} ml="auto" mr="auto" my="6" />,
    });
  }, [preview]);

  return (
    <ReactMarkdown components={ChakraUIRenderer(components)}>
      {children}
    </ReactMarkdown>
  );
};
