import type { DAS } from "helius-sdk";
import {
  Box,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  Spinner,
  Text,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  Flex,
  Wrap,
  WrapItem,
  IconButton,
  Container,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { fetchAssetsByOwner, fetchUser, updateProfile } from "lib/api";
import { useAuth } from "components/providers/auth";
import { Avatar } from "components/avatar";
import { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";

interface ProfileModalProps {
  open: boolean;
  onRequestClose: () => void;
}

interface EditProfileFields {
  name: string;
  item: {
    mint: string;
    uri: string;
  } | null;
}

export const ProfileModal = ({ open, onRequestClose }: ProfileModalProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [imageModal, setImageModal] = useState(false);

  const methods = useForm<EditProfileFields>({
    defaultValues: {
      name: "",
      item: null,
    },
  });
  const setValue = methods.setValue;

  const query = useQuery(
    ["user", auth.address],
    () => fetchUser(auth.address!),
    {
      enabled: Boolean(auth.address),
    }
  );

  useEffect(() => {
    if (query.data?.name) {
      setValue("name", query.data.name);
    }
    if (query.data?.avatar && query.data.mint) {
      setValue("item", {
        mint: query.data.mint,
        uri: query.data.avatar,
      });
    }
  }, [query.data, setValue]);

  const mutation = useMutation<void, Error, EditProfileFields>(
    async (data) => {
      if (!auth.address) {
        throw new Error("Not logged in");
      }

      const name = data.name.trim();
      const mint = data.item?.mint ?? null;

      await updateProfile(auth.address, name, mint);
    },
    {
      async onSuccess() {
        onRequestClose();
        toast.success("Profile updated");
        await queryClient.invalidateQueries(["user", auth.address]);
      },
      onError(error) {
        toast.error(error.message ?? "Error updating profile");
      },
    }
  );

  function renderBody() {
    if (!query.data) {
      return (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Spinner />
        </Box>
      );
    }

    return (
      <Container height="420px">
        <Flex justifyContent="center" py="6">
          <Box position="relative" borderRadius="full">
            <Controller
              name="item"
              control={methods.control}
              render={({ field }) => (
                <Avatar
                  size={100}
                  name="Selected user avatar"
                  image={field.value?.uri ?? undefined}
                />
              )}
            />
            <Box
              as="button"
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              backgroundColor="blackAlpha.700"
              opacity={0}
              cursor="pointer"
              transition="opacity 0.3s ease"
              _hover={{
                opacity: 1,
              }}
              onClick={() => setImageModal(true)}
            >
              <Text>Edit Image</Text>
            </Box>
          </Box>
        </Flex>
        <Text>Username</Text>
        <Input
          mb="2"
          placeholder="Name"
          {...methods.register("name", { required: true })}
        />
        <AnimatePresence>
          {imageModal && (
            <Box
              as={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              position="absolute"
              inset={0}
              zIndex={1}
              backgroundColor="blackAlpha.900"
            >
              <Box height="42px">
                <IconButton
                  aria-label="Back Button"
                  onClick={() => setImageModal(false)}
                >
                  <IoArrowBack size={18} />
                </IconButton>
              </Box>
              <ImageMenu
                onSelect={(item) => {
                  methods.setValue("item", {
                    mint: item.id,
                    // @ts-ignore
                    uri: item.content?.files?.[0]?.cdn_uri,
                  });
                  setImageModal(false);
                }}
              />
            </Box>
          )}
        </AnimatePresence>
      </Container>
    );
  }

  return (
    <Modal size="xl" isOpen={open} onClose={onRequestClose}>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        position="relative"
        backgroundColor="onda.1000"
        overflow="hidden"
      >
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton onClick={onRequestClose} />
        <ModalBody overflow="hidden">{renderBody()}</ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="primary"
            isLoading={mutation.isLoading}
            onClick={methods.handleSubmit((data) => mutation.mutate(data))}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface ImageMenuProps {
  onSelect: (item: DAS.GetAssetResponse) => void;
}

const ImageMenu = ({ onSelect }: ImageMenuProps) => {
  const auth = useAuth();
  const query = useQuery(
    ["assets", auth.address],
    () => fetchAssetsByOwner(auth.address!),
    {
      enabled: Boolean(auth.address),
    }
  );

  if (query.isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box height="100%" overflowY="scroll" pb="16">
      <Wrap width="100%" spacing="0">
        {query.data
          ?.filter((item: any) => item.content?.files[0]?.cdn_uri)
          .map((asset: any) => (
            <WrapItem
              key={asset.id}
              as="button"
              position="relative"
              flexBasis="20%"
              onClick={() => onSelect(asset)}
            >
              <Image
                fill
                alt={asset.content.metadata.name}
                src={asset.content.files[0].cdn_uri}
                style={{
                  objectFit: "cover",
                }}
              />
              <Box pb="100%" />
            </WrapItem>
          ))}
      </Wrap>
    </Box>
  );
};
