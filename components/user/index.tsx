import { Box, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import dayjs from "../../lib/dayjs";

interface UserWidgetProps {
  address?: string;
  createdAt?: string;
}

export const UserWidget = ({ address, createdAt }: UserWidgetProps) => {
  const shortenedAddress = useMemo(
    () => (address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null),
    [address]
  );
  const time = useMemo(
    () => (createdAt ? dayjs.unix(Number(createdAt)).fromNow() : null),
    [createdAt]
  );

  return (
    <Box>
      <Text fontSize="xs" color="gray.500">
        <a
          href={`https://explorer.solana.com/address/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          {shortenedAddress} · {time}
        </a>
      </Text>
    </Box>
  );
};
