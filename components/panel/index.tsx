import React from "react";
import { Box, BoxProps, forwardRef } from "@chakra-ui/react";

export const Panel = forwardRef<BoxProps, "div">(
  ({ children, ...other }, ref) => (
    <Box
      ref={ref}
      pt="6"
      pl="6"
      pr="6"
      pb="4"
      mb="2"
      borderWidth="1px"
      borderRadius="md"
      backgroundColor="onda.1000"
      borderColor="gray.800"
      boxShadow="md"
      {...other}
    >
      {children}
    </Box>
  )
);
