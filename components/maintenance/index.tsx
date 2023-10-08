import Image from "next/image";
import { useRouter } from "next/router";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useEffect } from "react";

export const Maintenance = () => {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      router.replace("/", "/");
    }
  }, [router]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      width="100%"
      alignItems="center"
      py="48"
    >
      <Image src="/onda.svg" alt="Onda Logo" width={68} height={68} />
      <Heading size="lg" mt="3">
        Under Maintenance
      </Heading>
      <Text fontStyle="italic" mt="1">
        Onda will return soon...
      </Text>
    </Box>
  );
};
