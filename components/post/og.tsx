import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";

import { fetchOGTags } from "lib/api";

interface OGProps {
  url: string;
}

export const OG = ({ url }: OGProps) => {
  const query = useQuery(["og_tags", url], () => fetchOGTags(url));
  const hasImage = query.data?.image && query.data.image.includes("https");

  return (
    <a href={url} target="_blank">
      <Box
        display="flex"
        position="relative"
        border="1px"
        borderColor="whiteAlpha.800"
        borderRadius="lg"
        overflow="hidden"
        width={144}
        minWidth={144}
        height={100}
        opacity={hasImage ? 1 : 0}
      >
        {hasImage && (
          <>
            <Image
              unoptimized
              alt="Link image"
              src={query.data!.image!}
              width={144}
              height={100}
              style={{
                objectFit: "cover",
              }}
            />
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="absolute"
              bottom="0"
              right="0"
              bgColor="#fff"
              height="18px"
              width="18px"
              borderTopLeftRadius="md"
            >
              <ExternalLinkIcon height="12px" width="12px" color="green.800" />
            </Box>
          </>
        )}
      </Box>
    </a>
  );
};
