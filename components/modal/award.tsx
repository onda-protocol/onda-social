import {
  Box,
  Button,
  Heading,
  Text,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Flex,
  ModalCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  SerializedAward,
  fetchAwards,
  signAndConfirmTransaction,
} from "lib/api";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAuth } from "components/providers/auth";

import { formatAmount } from "utils/format";

const AwardModalContext = createContext({
  isOpen: false,
  openModal: (_args: SelectedEntry) => {},
  closeModal: () => {},
});

interface AwardModalProviderProps {
  children: React.ReactNode;
}

interface SelectedEntry {
  entryId: string;
  author: string;
  forum: string;
  createdAt: number;
  editedAt: number | null;
  dataHash: string;
  nonce: number;
  callback: (award: SerializedAward) => void;
}

interface AwardMutationArgs extends SelectedEntry {
  Award: SerializedAward;
}

export const AwardModalProvider = ({ children }: AwardModalProviderProps) => {
  const { connection } = useConnection();
  const auth = useAuth();
  const [entry, setEntry] = useState<SelectedEntry | null>(null);
  const [selected, setSelected] = useState<SerializedAward | null>(null);
  const isOpen = entry !== null;

  const rewardsQuery = useQuery(["awards"], fetchAwards, {
    enabled: isOpen,
  });

  useEffect(() => {
    if (rewardsQuery.data) {
      setSelected(rewardsQuery.data[0]);
    }
  }, [rewardsQuery.data]);

  const closeModal = useCallback(() => setEntry(null), []);
  const openModal = useCallback((args: SelectedEntry) => setEntry(args), []);

  const giveRewardMutation = useMutation<void, Error, AwardMutationArgs>(
    async ({ Award, ...rest }) => {
      if (!auth.address) {
        throw new Error("Please connect your wallet");
      }

      if (!auth.signTransaction) {
        throw new Error("Please connect your wallet");
      }

      await signAndConfirmTransaction(connection, auth, {
        method: "giveAward",
        data: {
          ...rest,
          award: Award.id,
          payer: auth.address,
        },
      });
    },
    {
      onSuccess(_, variables) {
        closeModal();
        variables.callback(variables.Award);
        toast.success("Reward given 🎉");
      },
      onError(err) {
        console.log(err);
        // @ts-ignore
        console.log(err.logs);
        toast.error(err.message ?? "Something went wrong!");
      },
    }
  );

  const handleGiveReward = useCallback(() => {
    const mutate = giveRewardMutation.mutate;

    if (!selected) {
      return toast.error("Please select a reward");
    }

    if (!entry) {
      return toast.error("Entry not selected");
    }

    mutate({ ...entry, Award: selected });
  }, [selected, entry, giveRewardMutation.mutate]);

  const context = useMemo(() => {
    return {
      isOpen,
      openModal,
      closeModal,
    };
  }, [isOpen, openModal, closeModal]);

  return (
    <>
      <AwardModalContext.Provider value={context}>
        {children}
      </AwardModalContext.Provider>
      <Modal size="5xl" isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay
          bg={{
            base: "blackAlpha.900",
            md: "blackAlpha.800",
          }}
        />
        <ModalContent
          backgroundColor="onda.1050"
          alignSelf="center"
          marginTop={{
            xs: 0,
            md: "16",
          }}
          marginBottom={{
            xs: 0,
            md: "16",
          }}
          height={{
            base: "100vh",
            md: 460,
          }}
        >
          <ModalCloseButton />
          <ModalBody padding="0" height="100%">
            {rewardsQuery.isLoading ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                width="100%"
              >
                <Spinner />
              </Box>
            ) : (
              <Box
                display="flex"
                height="100%"
                flexDirection={{
                  base: "column",
                  md: "row",
                }}
              >
                <Box flex={3} p="6">
                  <Box pb="8">
                    <Heading fontSize="xl" mb="2">
                      Give an award to this post
                    </Heading>
                    <Text color="whiteAlpha.700" fontSize="md">
                      Awards are a way to recognize and reward other users for
                      their contributions to the community.
                    </Text>
                  </Box>
                  <Flex flex={1} display="flex" flexWrap="wrap">
                    {rewardsQuery.data &&
                      rewardsQuery.data.map((award) => (
                        <Flex key={award.id} width="25%" p="2">
                          <AwardItem
                            award={award}
                            selected={award.id === selected?.id}
                            onSelect={setSelected}
                          />
                        </Flex>
                      ))}
                  </Flex>
                </Box>
                <Box
                  flex={2}
                  borderColor="whiteAlpha.100"
                  borderTopWidth={{
                    base: "1px",
                    md: 0,
                  }}
                  borderLeftWidth={{
                    md: "1px",
                  }}
                >
                  <Flex
                    flexDirection="column"
                    justifyContent="flex-end"
                    height="100%"
                  >
                    <AwardDetails award={selected} />

                    <Flex flex={0} p="6" pt="0">
                      <Button
                        display={{
                          base: "none",
                          md: "inline-flex",
                        }}
                        width="100%"
                        isDisabled={!selected}
                        isLoading={giveRewardMutation.isLoading}
                        onClick={handleGiveReward}
                      >
                        Give &nbsp;🎉
                      </Button>
                    </Flex>
                  </Flex>
                </Box>
              </Box>
            )}
          </ModalBody>
          <ModalFooter
            display={{
              base: "flex",
              md: "none",
            }}
          >
            <Button
              display={{
                base: "inline-flex",
                md: "none",
              }}
              width="100%"
              isLoading={giveRewardMutation.isLoading}
              onClick={handleGiveReward}
            >
              Give &nbsp;🎉
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

interface AwardDetails {
  award: SerializedAward | null;
}

const AwardDetails = ({ award }: AwardDetails) => {
  const [userSplit, creatorSplit] = useMemo(() => {
    if (award) {
      if (award.feeBasisPoints === 0) {
        return [100, 0];
      }

      const creatorSplit = Math.round(award.feeBasisPoints / 100);
      const userSplit = 100 - creatorSplit;

      return [userSplit, creatorSplit];
    }
    return [0, 0];
  }, [award]);

  return award ? (
    <Flex flex={1} direction="column">
      <Flex
        flex={1}
        pt={{
          base: "0",
          md: "4",
        }}
        px={{
          base: "4",
          md: "6",
        }}
        align="center"
        direction={{
          base: "row",
          md: "column",
        }}
      >
        <Image
          unoptimized
          src={award.image}
          alt={award.name}
          height={90}
          width={90}
          style={{
            borderRadius: "3px",
          }}
        />
        <Box
          pl={{
            base: "2",
            md: "0",
          }}
        >
          <Heading
            size="md"
            textAlign={{
              base: "left",
              md: "center",
            }}
            pt={{
              base: "0",
              md: "4",
            }}
            mb="2"
          >
            {award.name}
          </Heading>
          <Text
            fontSize="sm"
            textAlign={{
              base: "left",
              md: "center",
            }}
            mb="2"
          >
            {award.description}
          </Text>
        </Box>
      </Flex>
      <Box
        flex={0}
        width="100%"
        borderColor="whiteAlpha.100"
        borderTopWidth="1px"
        p="6"
      >
        <Flex mb="1">
          <Flex flex={1}>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="600">
              Total
            </Text>
          </Flex>
          <Flex flex={1} justifyContent="flex-end">
            <Image
              unoptimized
              alt="SOL"
              height={12}
              width={12}
              src="/solana.svg"
              style={{
                display: "inline",
              }}
            />
            <Text
              color="whiteAlpha.900"
              fontSize="sm"
              fontWeight="600"
              whiteSpace="nowrap"
              pl="1"
            >
              {formatAmount(award.amount)}
            </Text>
          </Flex>
        </Flex>
        <Flex mb="1">
          <Flex flex={1}>
            <Text
              color="whiteAlpha.700"
              fontSize="sm"
              fontWeight="400"
              whiteSpace="nowrap"
            >
              User tip [{userSplit}%]
            </Text>
          </Flex>
          <Flex flex={1} justifyContent="flex-end">
            <Text
              color="whiteAlpha.700"
              fontSize="sm"
              fontWeight="400"
              whiteSpace="nowrap"
            >
              ◎
              {userSplit > 0
                ? formatAmount((Number(award.amount) / 100) * userSplit)
                : formatAmount(award.amount)}
            </Text>
          </Flex>
        </Flex>
        {award.Matching ? (
          <Flex mb="1">
            <Flex flex={1}>
              <Text
                color="whiteAlpha.700"
                fontSize="sm"
                fontWeight="400"
                whiteSpace="nowrap"
              >
                ↳ Item [x1]
              </Text>
            </Flex>
            <Flex flex={1} justifyContent="flex-end">
              <Text
                color="whiteAlpha.700"
                fontSize="sm"
                fontWeight="400"
                whiteSpace="nowrap"
              >
                {award.Matching.name}
              </Text>
            </Flex>
          </Flex>
        ) : null}
        <Flex mb="1">
          <Flex flex={1}>
            <Text
              color="whiteAlpha.700"
              fontSize="sm"
              fontWeight="400"
              whiteSpace="nowrap"
            >
              Creator tip [{creatorSplit}%]
            </Text>
          </Flex>
          <Flex flex={1} justifyContent="flex-end">
            <Text
              color="whiteAlpha.700"
              fontSize="sm"
              fontWeight="400"
              whiteSpace="nowrap"
            >
              ◎
              {creatorSplit > 0
                ? formatAmount((Number(award.amount) / 100) * creatorSplit)
                : "0.00"}
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  ) : null;
};

interface AwardItemProps {
  award: SerializedAward;
  selected: Boolean;
  onSelect: (award: SerializedAward) => void;
}

const AwardItem = ({ award, selected, onSelect }: AwardItemProps) => (
  <Box
    as="button"
    padding={2}
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="space-between"
    minHeight="98px"
    width="100%"
    boxShadow={
      selected ? "0 0 4px 2px var(--chakra-colors-whiteAlpha-300)" : undefined
    }
    borderRadius="md"
    cursor="pointer"
    transition="all 0.2s ease-in-out"
    _hover={{
      boxShadow: "0 0 6px 3px var(--chakra-colors-whiteAlpha-400)",
    }}
    onClick={() => onSelect(award)}
  >
    <Flex flexDirection="column" alignItems="center">
      <Image src={award.image} alt={award.name} height={42} width={42} />
      <Text
        fontSize="sm"
        fontWeight="500"
        lineHeight="1.4"
        marginTop="1"
        px="1"
        width="100%"
        noOfLines={2}
        textAlign="center"
      >
        {award.name}
      </Text>
    </Flex>
    <Flex display="flex" alignItems="center" mt="1">
      <Image
        unoptimized
        alt="SOL"
        height={10}
        width={10}
        src="/solana.svg"
        style={{
          display: "inline",
        }}
      />
      <Text
        color="whiteAlpha.700"
        fontSize="xs"
        fontWeight="600"
        textAlign="center"
        ml="0.5"
      >
        {formatAmount(award.amount)}
      </Text>
    </Flex>
  </Box>
);

export const useAwardModal = () => {
  return useContext(AwardModalContext);
};
