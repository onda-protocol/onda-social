import type { NextPage } from "next";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Controller, set, useForm } from "react-hook-form";
import { IoHelpCircle } from "react-icons/io5";
import { web3 } from "@project-serum/anchor";
import {
  Box,
  Container,
  Heading,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Text,
  Textarea,
  Tooltip,
  Select,
  Stepper,
  Step,
  StepIndicator,
  StepIcon,
  StepNumber,
  StepStatus,
  Progress,
  useSteps,
  Button,
} from "@chakra-ui/react";
import {
  getConcurrentMerkleTreeAccountSize,
  ValidDepthSizePair,
} from "@solana/spl-account-compression";
import { useConnection } from "@solana/wallet-adapter-react";

import { ImagePicker } from "components/input/imagePicker";

const SIZE_OPTIONS = [14, 15, 16, 17, 18, 19, 20];

const STEPS = [
  { title: "First", description: "Config" },
  { title: "Second", description: "Metadata" },
  { title: "Third", description: "Admins" },
];

type CommunityConfig = {
  sizePair: ValidDepthSizePair;
};

const New: NextPage = () => {
  const { activeStep, goToNext } = useSteps({
    index: 0,
    count: STEPS.length,
  });

  const max = STEPS.length - 1;
  const progressPercent = (activeStep / max) * 100;
  const activeStepText = STEPS[activeStep].description;

  return (
    <Container maxW="container.sm">
      <Heading my="12">Create Community</Heading>
      <Box position="relative">
        <Stepper size="sm" index={activeStep} gap="0">
          {STEPS.map((_, i) => (
            <Step key={i}>
              <StepIndicator bg="onda.900">
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
            </Step>
          ))}
        </Stepper>
        <Progress
          value={progressPercent}
          position="absolute"
          height="3px"
          width="full"
          top="9px"
          zIndex={-1}
        />
      </Box>
      <Text my="4">
        Step {activeStep + 1}: <b>{activeStepText}</b>
      </Text>
      {activeStep === 0 && <Step1 onNext={goToNext} />}
      {activeStep === 1 && <Step2 onNext={goToNext} />}
    </Container>
  );
};

interface Step1Form {
  slug: string;
  size: number;
  logo: File | null;
}

interface Step1Props {
  onNext: () => void;
}

const Step1 = ({ onNext }: Step1Props) => {
  const { connection } = useConnection();
  const [lamports, setLamports] = useState<number>();
  const methods = useForm<Step1Form>({});
  const size = methods.watch("size");

  useEffect(() => {
    async function fetchCost() {
      const space = getConcurrentMerkleTreeAccountSize(size, 64);
      const canopyDepth = size - 5;
      const canopySpace = (Math.pow(2, canopyDepth) - 2) * 32;
      const totalSpace = space + canopySpace;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        totalSpace
      );
      setLamports(lamports);
    }

    if (size) {
      fetchCost();
    }
  }, [connection, size]);

  return (
    <Box noValidate as="form" onSubmit={methods.handleSubmit(() => onNext())}>
      <Text mb="8">
        This is the first step in creating a community. Select a slug and the
        size of merkle tree you want to use. In future, you will be able to
        migrate to a larger tree if your forum reaches max capacity.
      </Text>

      <FormControl mb="4">
        <FormLabel>Slug</FormLabel>
        <Input
          {...methods.register("slug", { required: true })}
          placeholder="Slug"
        />
        <FormHelperText>
          This is the slug that will be used in the URL. It must be unique.
        </FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel>Capacity</FormLabel>
        <Select
          {...methods.register("size", { required: true })}
          placeholder="Forum Capacity"
          mt="2"
        >
          {SIZE_OPTIONS.map((maxDepth) => (
            <option key={maxDepth} value={maxDepth}>
              {1 << maxDepth} entries
            </option>
          ))}
        </Select>
        <FormHelperText>
          This is the maximum number of entries that can be added to the forum.
        </FormHelperText>
      </FormControl>

      {lamports && (
        <Box display="flex" my="4">
          <Text pr="1">Merkle tree cost: </Text>
          <Image alt="Sol" src="/solana.svg" height={14} width={14} />
          <Text pl="1" fontWeight="semibold">
            {Number(lamports / web3.LAMPORTS_PER_SOL).toFixed(2)}
          </Text>
        </Box>
      )}

      <Box display="flex" justifyContent="flex-end">
        <Button type="submit">Submit</Button>
      </Box>
    </Box>
  );
};

interface Step2Form {
  name: string;
  description: string;
  logo: File | null;
  banner: File | null;
}

interface Step2Props {
  onNext: () => void;
}

const Step2 = ({ onNext }: Step2Props) => {
  const methods = useForm<Step2Form>();

  return (
    <Box noValidate as="form" onSubmit={methods.handleSubmit(() => onNext())}>
      <Text mb="8">
        Add a name and description for your community. You can also upload a
        logo and banner image.
      </Text>

      <FormControl mb="4">
        <FormLabel>Name</FormLabel>
        <Input
          {...methods.register("name", { required: true })}
          placeholder="Name"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          {...methods.register("description", { required: true })}
          placeholder="Description"
          mt="2"
        />
      </FormControl>

      <Box display="flex">
        <Box flex={0}>
          <FormControl mt="6">
            <FormLabel>Logo</FormLabel>
            <Controller
              name="logo"
              control={methods.control}
              render={({ field }) => (
                <Box height="200px" width="200px">
                  <ImagePicker {...field} />
                </Box>
              )}
            />
          </FormControl>
        </Box>
        <Box flex={1}>
          <FormControl mt="6">
            <FormLabel>Banner</FormLabel>
            <Controller
              name="banner"
              control={methods.control}
              render={({ field }) => <ImagePicker {...field} />}
            />
          </FormControl>
        </Box>
      </Box>

      <Box display="flex" justifyContent="flex-end" mt="6">
        <Button type="submit">Submit</Button>
      </Box>
    </Box>
  );
};

export default New;
