import {
  Box,
  Button,
  Heading,
  Spinner,
  Text,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalBody,
  Wrap,
  WrapItem,
  ModalFooter,
} from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { web3 } from "@project-serum/anchor";
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
import { SerializedAward, fetchAwards, getTransaction } from "lib/api";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAuth } from "components/providers/auth";
import base58 from "bs58";

import { formatAmount } from "utils/format";

const AwardModalContext = createContext({
  isOpen: false,
  openModal: (
    _entryId: string,
    _callback: (award: SerializedAward) => void
  ) => {},
  closeModal: () => {},
});

interface AwardModalProviderProps {
  children: React.ReactNode;
}

interface SelectedEntry {
  entryId: string;
  callback: (award: SerializedAward) => void;
}

interface AwardMutationArgs {
  entryId: string;
  award: SerializedAward;
  callback: (award: SerializedAward) => void;
}

export const AwardModalProvider = ({ children }: AwardModalProviderProps) => {
  const { connection } = useConnection();
  const auth = useAuth();
  const [entry, setEntry] = useState<SelectedEntry | null>(null);
  const [selected, setSelected] = useState<SerializedAward>();
  const isOpen = entry !== null;

  // const rewardsQuery = useQuery(["awards"], fetchAwards, {
  //   enabled: isOpen,
  // });

  const awards = [
    {
      id: "0",
      amount: BigInt(5000000).toString(),
      image: "/glass.png",
      name: "Glass",
      description:
        "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
    },
    {
      id: "1",
      amount: BigInt(10000000).toString(),
      image: "/bottle.png",
      name: "Message in a Bottle",
      description:
        "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
    },
    {
      id: "2",
      amount: BigInt(10000000).toString(),
      image: "/plankton.png",
      name: "Plankton",
      description:
        "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
    },
    {
      id: "3",
      amount: BigInt(20000000).toString(),
      image: "/crab.png",
      name: "Crab",
      description:
        "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
    },
    {
      id: "4",
      amount: BigInt(30000000).toString(),
      image: "/glasseater.png",
      name: "Glass Eater",
      description:
        "Activated charcoal affogato truffaut pour-over tumblr pop-up taiyaki.",
    },
  ];

  // useEffect(() => {
  //   if (rewardsQuery.data) {
  //     setSelected(rewardsQuery.data[0]);
  //   }
  // }, [rewardsQuery.data]);

  const closeModal = useCallback(() => setEntry(null), []);
  const openModal = useCallback(
    (entryId: string, callback: (award: SerializedAward) => void) =>
      setEntry({ entryId, callback }),
    []
  );

  const giveRewardMutation = useMutation<void, Error, AwardMutationArgs>(
    async ({ entryId, award }) => {
      if (!auth.address) {
        throw new Error("Please connect your wallet");
      }

      if (!auth.signTransaction) {
        throw new Error("Please connect your wallet");
      }

      const response = await getTransaction({
        method: "giveAward",
        data: {
          entryId,
          award: award.id,
          payer: auth.address,
        },
      });

      const transaction = web3.Transaction.from(
        base58.decode(response.transaction)
      );
      const payerSig = transaction.signatures.find((sig) =>
        transaction.feePayer?.equals(sig.publicKey)
      );

      if (!payerSig?.signature) {
        throw new Error("Payer signature not found");
      }

      const signedTransaction = await auth.signTransaction(transaction);
      signedTransaction.addSignature(payerSig.publicKey, payerSig.signature);

      const txId = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          preflightCommitment: "confirmed",
        }
      );

      const blockhash = await connection.getLatestBlockhash();
      const result = await connection.confirmTransaction(
        {
          signature: txId,
          ...blockhash,
        },
        "confirmed"
      );

      if (result.value.err) {
        throw new Error(result.value.err.toString());
      }
    },
    {
      onSuccess(_, variables) {
        closeModal();
        variables.callback(variables.award);
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

    mutate({ ...entry, award: selected });
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
      <Modal size="3xl" isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent
          backgroundColor="onda.1050"
          alignSelf="center"
          minHeight={{
            base: "100vh",
            md: 420,
          }}
        >
          <ModalBody padding="0">
            <Box
              display="flex"
              flexDirection={{
                base: "column",
                md: "row",
              }}
            >
              <Box flex={3} p="6">
                <Box pb="6">
                  <Heading fontSize="xl" pb="2">
                    Give an award to this post
                  </Heading>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Awards are a way to recognize and reward other users for
                    their contributions to the community. Fees are divided
                    between the user and the community.
                  </Text>
                </Box>
                <Wrap display="flex" flexWrap="wrap" spacing="0">
                  {awards &&
                    awards.map((award) => (
                      <WrapItem key={award.id} width="25%">
                        <AwardItem
                          // @ts-expect-error
                          award={award}
                          selected={award.id === selected?.id}
                          onSelect={setSelected}
                        />
                      </WrapItem>
                    ))}
                </Wrap>
              </Box>
              <Box
                flex={2}
                borderLeftWidth="1px"
                borderLeftColor="whiteAlpha.100"
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  padding="6"
                  height="100%"
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    {selected ? (
                      <>
                        <Image
                          src={selected.image}
                          alt={selected.name}
                          height={90}
                          width={90}
                          style={{
                            borderRadius: "3px",
                          }}
                        />
                        <Heading size="md" textAlign="center" pt="4" pb="2">
                          {selected.name} Award
                        </Heading>
                        <Text fontSize="sm" textAlign="center" mb="2">
                          Boosts visibility of a comment or post.
                        </Text>
                        <Text
                          color="whiteAlpha.600"
                          fontSize="xs"
                          textAlign="center"
                        >
                          NOTE: This award is for demo purposes only.
                        </Text>
                      </>
                    ) : null}
                  </Box>

                  <Button
                    display={{
                      base: "none",
                      md: "block",
                    }}
                    width="100%"
                    isLoading={giveRewardMutation.isLoading}
                    onClick={handleGiveReward}
                  >
                    Give &nbsp;🎉
                  </Button>
                </Box>
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              display={{
                base: "block",
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
    height="98px"
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
    {award.image && (
      <Image src={award.image} alt={award.name} height={42} width={42} />
    )}
    <Text
      fontSize="sm"
      fontWeight="600"
      lineHeight="1.2"
      marginTop="1"
      px="2"
      width="100%"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      textAlign="center"
    >
      {award.name}
    </Text>
    <Box display="flex" alignItems="center" mt="1">
      <Image
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
    </Box>
  </Box>
);

export const useAwardModal = () => {
  return useContext(AwardModalContext);
};
