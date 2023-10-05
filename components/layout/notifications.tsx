import Image from "next/image";
import { useRouter } from "next/router";
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
  Spinner,
} from "@chakra-ui/react";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { NotificationType } from "@prisma/client";
import { Fragment, useEffect, useMemo } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import dayjs from "lib/dayjs";

import {
  SerializedNotification,
  fetchNotificationCount,
  fetchUserNotifications,
  markNotificationsAsRead,
  signAndConfirmTransaction,
} from "lib/api";
import { useAuth } from "components/providers/auth";

export const Notifications = () => {
  const auth = useAuth();

  const countQuery = useQuery({
    enabled: Boolean(auth.address),
    queryKey: ["notifications_count", auth.address],
    queryFn: () => fetchNotificationCount(auth.address!),
  });
  const count = countQuery.data;

  return (
    <Popover isLazy placement="bottom-start">
      <PopoverTrigger>
        <Box position="relative">
          <IconButton aria-label="Notifications">
            <IoNotificationsOutline size={21} />
          </IconButton>
          {count ? (
            <Box
              position="absolute"
              top={-2}
              right={-2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="16px"
              width="16px"
              fontSize="10px"
              borderRadius="full"
              backgroundColor="red.600"
            >
              {count}
            </Box>
          ) : null}
        </Box>
      </PopoverTrigger>
      <PopoverContent bg="onda.1000" boxShadow="xl" width="sm">
        <PopoverArrow bg="onda.1000" />
        <PopoverHeader
          fontWeight="semibold"
          fontSize="sm"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          py="4"
        >
          Notifications
        </PopoverHeader>
        <PopoverBody
          height={300}
          overflowY="auto"
          paddingInlineEnd="0"
          paddingInlineStart="0"
          paddingTop="0"
        >
          <NotificationList />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const NotificationList = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useInfiniteQuery({
    enabled: Boolean(auth.address),
    queryKey: ["notifications", auth.address],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchUserNotifications(auth.address!, pageParam);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });

  useEffect(() => {
    if (auth.address) {
      markNotificationsAsRead(auth.address)
        .then(() =>
          queryClient.invalidateQueries(["notifications_count", auth.address])
        )
        .catch((err) => {
          console.error(err);
        });
    }
  }, [auth.address, queryClient]);

  if (notificationsQuery.isLoading) {
    return (
      <Box display="flex" justifyContent="center" pt="12">
        <Spinner />
      </Box>
    );
  }

  return (
    <Fragment>
      {notificationsQuery.data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.map((notification) => (
            <NotificationItem key={notification.id} item={notification} />
          ))}
        </Fragment>
      )) ?? null}
    </Fragment>
  );
};

interface NotificationProps {
  item: SerializedNotification;
}

const NotificationItem = ({ item }: NotificationProps) => {
  const auth = useAuth();
  const { connection } = useConnection();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    async () => {
      if (!auth.signTransaction) {
        throw new Error("Sign transaction not available");
      }

      if (item.Claim) {
        const result = await signAndConfirmTransaction(connection, auth, {
          method: "claimAward",
          data: {
            award: item.Claim.award,
            claim: item.Claim.id,
            recipient: auth.address!,
          },
        });
        console.log(result);
      }
    },
    {
      onSuccess() {
        toast.success("Claimed award");

        if (item.Claim) {
          queryClient.setQueryData<InfiniteData<SerializedNotification[]>>(
            ["notifications", auth.address],
            (data) => {
              if (data) {
                for (const pageIndex in data.pages) {
                  const page = data.pages[pageIndex];
                  for (const index in page) {
                    const notification = page[index];

                    if (notification.id === item.id) {
                      return {
                        ...data,
                        pages: [
                          ...data.pages.slice(0, Number(page)),
                          [
                            ...page.slice(0, Number(index)),
                            {
                              ...notification,
                              Claim: null,
                            },
                            ...page.slice(Number(index) + 1),
                          ],
                          ...data.pages.slice(Number(page) + 1),
                        ],
                      };
                    }
                  }
                }
              }
              return data;
            }
          );
        }
      },
    }
  );

  const createdAt = useMemo(
    () => dayjs.unix(Number(item.createdAt)).fromNow(),
    [item.createdAt]
  );

  const href = useMemo(() => {
    if (item.meta) {
      if ("postId" in item.meta) {
        return `/comments/${item.meta.postId}`;
      }
    }
  }, [item.meta]);

  return (
    <Box
      as="button"
      width="100%"
      pl="3"
      pr="6"
      py="6"
      bgColor={item.read ? "transparent" : "whiteAlpha.100"}
      _hover={{
        bg: "whiteAlpha.200",
      }}
      onClick={() => {
        if (href) {
          router.push(href);
        } else if (item.type === NotificationType.Claim) {
          mutation.mutate();
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" width="100%">
        {item.meta && typeof item.meta.image === "string" && (
          <Box flexBasis="42px" display="flex" alignItems="center">
            <Image alt="award" src={item.meta.image} height={32} width={32} />
          </Box>
        )}
        <Box flex={1} textAlign="left">
          <Box display="flex" alignItems="center">
            <Heading fontSize="sm" fontWeight="semibold">
              {item.title}
            </Heading>
            <Text textAlign="right" fontSize="xs" color="gray.500" pl="2">
              {createdAt}
            </Text>
          </Box>
          <Text fontSize="sm">{item.body}</Text>
          {item.Claim && (
            <Box pt="2">
              <Button size="sm" isLoading={mutation.isLoading}>
                Claim
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
