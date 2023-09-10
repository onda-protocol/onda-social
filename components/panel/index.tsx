import React from "react";
import { Box, BoxProps } from "@chakra-ui/react";

export const Panel: React.FC<BoxProps> = ({ children, ...other }) => (
  <Box
    pt="6"
    pl="6"
    pr="6"
    pb="4"
    mb="2"
    borderWidth="1px"
    borderRadius="md"
    backgroundColor="onda.1000"
    borderColor="gray.800"
    {...other}
  >
    {children}
  </Box>
);
