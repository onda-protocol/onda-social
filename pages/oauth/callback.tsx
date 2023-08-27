import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useMagic } from "components/providers/magic";

const Callback: NextPage = () => {
  const router = useRouter();
  const magic = useMagic();

  useEffect(() => {
    if (magic && router.isReady) {
      magic.oauth
        .getRedirectResult()
        .then((result) => {
          console.log("result: ", result);
          router.push("/");
        })
        .catch((err) => console.log("err: ", err));
    }
  }, [magic, router]);

  return (
    <Box
      display="flex"
      height="100%"
      width="100%"
      alignItems="center"
      justifyContent="center"
      padding="12"
    >
      <Text textAlign="center">Redirecting</Text>
      <Spinner />
    </Box>
  );
};

export default Callback;
