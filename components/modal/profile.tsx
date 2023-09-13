import type { NextPage } from "next";
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
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { fetchUser, updateProfile } from "lib/api";
import { useAuth } from "components/providers/auth";
import { Avatar } from "components/avatar";

interface ProfileModalProps {
  open: boolean;
  onRequestClose: () => void;
}

interface EditProfileFields {
  name: string;
  mint: string | null;
}

export const ProfileModal = ({ open, onRequestClose }: ProfileModalProps) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery(
    ["user", auth.address],
    () => fetchUser(auth.address!),
    {
      enabled: Boolean(auth.address),
    }
  );

  const mutation = useMutation<void, Error, EditProfileFields>(
    async (data) => {
      if (!auth.address) {
        throw new Error("Not logged in");
      }

      const name = data.name.trim();
      const mint = data.mint?.length ? data.mint : null;

      await updateProfile(auth.address, name, mint);
    },
    {
      async onSuccess() {
        await queryClient.invalidateQueries(["user", auth.address]);
        toast.success("Profile updated");
        onRequestClose();
      },
      onError(error) {
        toast.error(error.message ?? "Error updating profile");
      },
    }
  );

  const methods = useForm<EditProfileFields>({
    defaultValues: {
      name: "",
      mint: null,
    },
  });

  function renderBody() {
    if (!query.data) {
      return (
        <Box display="flex" alignItems="center" justifyContent="center">
          <Spinner />
        </Box>
      );
    }

    return (
      <Box>
        <Avatar
          size={80}
          name={query.data?.name ?? ""}
          image={query.data?.avatar ?? undefined}
        />
        <Text>Name</Text>
        <Input
          mb="2"
          placeholder="Name"
          {...methods.register("name", { required: true })}
        />
      </Box>
    );
  }

  return (
    <Modal size="xl" isOpen={open} onClose={onRequestClose}>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent backgroundColor="onda.1000">
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton onClick={onRequestClose} />
        <ModalBody padding="8">{renderBody()}</ModalBody>
        <ModalFooter>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isLoading}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
