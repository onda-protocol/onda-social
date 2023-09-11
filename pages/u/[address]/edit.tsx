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
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { fetchUser, updateProfile } from "lib/api";
import { useAuth } from "components/providers/auth";

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
  const auth = useAuth();

  const mutation = useMutation<void, Error, EditProfileFields>(
    async (data) => {
      if (!auth.address) {
        throw new Error("Not logged in");
      }

      const name = data.name.trim();
      const mint = data.mint.length ? data.mint : null;

      await updateProfile(auth.address, name, mint);
    },
    {
      onSuccess() {
        toast.success("Profile updated");
        router.push(`/u/${auth.address}`);
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
