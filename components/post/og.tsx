import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@chakra-ui/react";

import { fetchOGTags } from "lib/api";

const MAX_WIDTH = 120;

interface OGProps {
  url: string;
}

export const OG = ({ url }: OGProps) => {
  const query = useQuery(["og_tags", url], () => fetchOGTags(url));

  if (!query.data?.image || !query.data.image.includes("https")) {
    return null;
  }

  return (
    <Box display="flex" minWidth={120}>
      <Image
        unoptimized
        alt="Link image"
        src={query.data.image}
        height={120}
        width={120}
        style={{
          objectFit: "contain",
        }}
      />
    </Box>
  );
};
