import { useState } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Heading,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Text,
} from "@chakra-ui/react";
import { IoNotificationsOutline } from "react-icons/io5";

export const Notifications = () => {
  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <IconButton aria-label="Notifications" variant="ghost">
          <IoNotificationsOutline size={18} />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent bg="onda.1000" boxShadow="xl" width="sm">
        <PopoverArrow bg="onda.1000" />
        <PopoverHeader
          fontWeight="semibold"
          fontSize="sm"
          borderBottom="none"
          py="4"
        >
          Notifications
        </PopoverHeader>
        <PopoverBody
          maxH={300}
          overflowY="auto"
          paddingInlineEnd="0"
          paddingInlineStart="0"
          paddingTop="0"
        >
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
          <NotificationItem />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const NotificationItem = () => {
  return (
    <Box
      as="button"
      width="100%"
      pl="3"
      pr="6"
      py="6"
      _hover={{
        bg: "whiteAlpha.100",
      }}
    >
      <Box display="flex" justifyContent="space-between" width="100%">
        <Box flexBasis="42px" display="flex" alignItems="center">
          <Image alt="award" src="/glass.png" height={32} width={32} />
        </Box>
        <Box flex={1} textAlign="left">
          <Box display="flex" alignItems="center">
            <Heading fontSize="sm" fontWeight="semibold">
              Glass Award
            </Heading>
            <Text textAlign="right" fontSize="xs" color="gray.500" pl="2">
              2 hours ago
            </Text>
          </Box>
          <Text fontSize="sm">You have a new award to claim!</Text>
        </Box>
        <Box display="flex" alignItems="center">
          <Button size="sm">Claim</Button>
        </Box>
      </Box>
    </Box>
  );
};
