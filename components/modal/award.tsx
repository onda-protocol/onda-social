import { Box, Button, Heading, Spinner, Text } from "@chakra-ui/react";
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
import { Modal } from "./base";
import { SerializedAward, fetchAwards, getTransaction } from "lib/api";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAuth } from "components/providers/auth";
import base58 from "bs58";

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

  const rewardsQuery = useQuery(["awards"], fetchAwards, {
    enabled: isOpen,
  });

  useEffect(() => {
    if (rewardsQuery.data) {
      setSelected(rewardsQuery.data[0]);
    }
  }, [rewardsQuery.data]);

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
      <Modal isOpen={isOpen} onRequestClose={closeModal}>
        <Box display="flex">
          <Box flex={1} p="6" minHeight={300}>
            <Heading fontSize="xl" pb="5">
              Awards
            </Heading>
            <Box display="flex" gap="2">
              {rewardsQuery.data === undefined ? (
                <Spinner />
              ) : (
                rewardsQuery.data.map((reward) => (
                  <Box
                    as="button"
                    key={reward.id}
                    sx={{
                      borderWidth: "1px",
                      borderColor:
                        selected?.id === reward.id
                          ? "whiteAlpha.700"
                          : "transparent",
                      borderRadius: "4px",
                      cursor: "pointer",
                      height: "42px",
                      width: "42px",
                      "&:hover": {
                        borderColor: "whiteAlpha.700",
                        boxShadow:
                          "0 0 6px 3px var(--chakra-colors-whiteAlpha-600)",
                      },
                    }}
                    onClick={() => setSelected(reward)}
                  >
                    {reward.image && (
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        height={42}
                        width={42}
                        style={{
                          borderRadius: "3px",
                        }}
                      />
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Box>
          <Box
            width={206}
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
              <Box display="flex" flexDirection="column" alignItems="center">
                {selected ? (
                  <>
                    <Image
                      src={selected.image}
                      alt={selected.name}
                      height={69}
                      width={69}
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
                width="100%"
                isLoading={giveRewardMutation.isLoading}
                onClick={handleGiveReward}
              >
                Give &nbsp;🎉
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export const useAwardModal = () => {
  return useContext(AwardModalContext);
};