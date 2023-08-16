import { Box, Button, Heading, Spinner, Text } from "@chakra-ui/react";
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
import { Modal } from "./base";
import { SerializedReward, fetchRewards } from "lib/api";
import { giveAward } from "lib/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

const RewardModalContext = createContext({
  isOpen: false,
  openModal: (_entryId: string) => {},
  closeModal: () => {},
});

interface RewardModalProviderProps {
  children: React.ReactNode;
}

interface AwardMutationArgs {
  entryId: string;
  award: SerializedReward;
}

export const RewardModalProvider = ({ children }: RewardModalProviderProps) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SerializedReward>();
  const isOpen = entryId !== null;

  const rewardsQuery = useQuery(["rewards"], fetchRewards, {
    enabled: isOpen,
  });

  useEffect(() => {
    if (rewardsQuery.data) {
      setSelected(rewardsQuery.data[0]);
    }
  }, [rewardsQuery.data]);

  const closeModal = useCallback(() => setEntryId(null), []);
  const openModal = useCallback((entryId: string) => setEntryId(entryId), []);

  const giveRewardMutation = useMutation<void, Error, AwardMutationArgs>(
    async ({ entryId, award }) => {
      if (!anchorWallet) {
        toast.error("Please connect your wallet");
        return;
      }

      return giveAward(connection, anchorWallet, {
        entryId,
        award,
      });
    },
    {
      onSuccess() {
        closeModal();
        toast.success("Reward given 🎉");
      },
      onError(err) {
        console.log(err);
        // @ts-ignore
        console.log(err.logs);
        toast.error("Something went wrong!");
      },
    }
  );

  const handleGiveReward = useCallback(() => {
    const mutate = giveRewardMutation.mutate;

    if (!selected) {
      return toast.error("Please select a reward");
    }

    if (!entryId) {
      return toast.error("Entry not selected");
    }

    mutate({ entryId, award: selected });
  }, [selected, entryId, giveRewardMutation.mutate]);

  const context = useMemo(() => {
    return {
      isOpen,
      openModal,
      closeModal,
    };
  }, [isOpen, openModal, closeModal]);

  return (
    <>
      <RewardModalContext.Provider value={context}>
        {children}
      </RewardModalContext.Provider>
      <Modal isOpen={isOpen} onRequestClose={closeModal}>
        <Box display="flex">
          <Box
            display="flex"
            flexDirection="column"
            p="6"
            flex={1}
            minHeight={300}
          >
            <Heading fontSize="xl" pb="5">
              Awards
            </Heading>

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
                    <Text fontSize="sm" textAlign="center">
                      Boosts visibility of a comment or post.
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

export const useRewardModal = () => {
  return useContext(RewardModalContext);
};
