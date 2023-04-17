import type { NextPage } from "next";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { fetchUser } from "lib/api";
import { updateProfile } from "lib/anchor";

const EditProfile: NextPage = () => {
  const router = useRouter();
  const address = router.query.address as string;
  const query = useQuery(["user", address], () => fetchUser(address));

  if (!query.data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Container maxW="container.sm">
      <Heading size="md" my="6">
        Update Profile
      </Heading>
      <EditProfileForm
        name={query.data.name ?? ""}
        mint={query.data.mint ?? ""}
      />
    </Container>
  );
};

interface EditProfileFields {
  name: string;
  mint: string;
}

const EditProfileForm: React.FC<EditProfileFields> = ({ name, mint }) => {
  const router = useRouter();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const mutation = useMutation<void, Error, EditProfileFields>(
    (data) => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }

      return updateProfile(connection, anchorWallet, {
        name: data.name.trim(),
        mint: data.mint.trim(),
      });
    },
    {
      onSuccess() {
        toast.success("Profile updated");
        router.push(`/u/${anchorWallet?.publicKey.toBase58()}`);
      },
      onError(error) {
        toast.error(error.message ?? "Error updating profile");
      },
    }
  );

  const methods = useForm<EditProfileFields>({
    defaultValues: {
      name: name ?? "",
      mint: mint ?? "",
    },
  });

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => mutation.mutate(data))}
    >
      <Input
        mb="2"
        placeholder="Name"
        {...methods.register("name", { required: true })}
      />
      <Input
        mb="2"
        placeholder="Mint"
        {...methods.register("mint", { required: true })}
      />
      <Box display="flex" mt="2" justifyContent="right">
        <Button type="submit" isLoading={mutation.isLoading}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default EditProfile;
