import type { NextPage } from "next";
import { Container } from "@chakra-ui/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/router";

const User: NextPage = () => {
  const router = useRouter();
  const address = router.query.address as string;
  const query = useQuery(["user", address], () => {
    return fetch(`/api/user/${address}`).then((res) => res.json());
  });

  return (
    <Container maxW="container.sm">
      <Image />
    </Container>
  );
};

export default User;
