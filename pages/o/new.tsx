import type { NextPage } from "next";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { IoTrash } from "react-icons/io5";
import { web3 } from "@project-serum/anchor";
import {
  Box,
  Container,
  Divider,
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
  IconButton,
  CardBody,
  Card,
} from "@chakra-ui/react";
import { getConcurrentMerkleTreeAccountSize } from "@solana/spl-account-compression";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";

import { createNamepace, initForum } from "lib/anchor";
import { upload } from "lib/bundlr";
import { ImagePicker } from "components/input/imagePicker";

const SIZE_OPTIONS = [14, 15, 16, 17, 18, 19, 20];

const STEPS = [
  { title: "First", description: "Config" },
  { title: "Second", description: "Metadata" },
  { title: "Third", description: "Confirm" },
];

const New: NextPage = () => {
  const [step1Data, setStep1Data] = useState<Step1Form>();
  const [step2Data, setStep2Data] = useState<Step2Form>();
  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: STEPS.length,
  });

  const max = STEPS.length - 1;
  const progressPercent = (activeStep / max) * 100;
  const activeStepText = STEPS[activeStep].description;

  return (
    <Container maxW="container.sm">
      <Heading my="12">Create Community</Heading>
      <Text my="4">
        Step {activeStep + 1}: <b>{activeStepText}</b>
      </Text>
      <Box position="relative" mb="8">
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
      {activeStep === 0 && (
        <Step1
          onNext={(data) => {
            setStep1Data(data);
            goToNext();
          }}
        />
      )}
      {activeStep === 1 && (
        <Step2
          onPrev={goToPrevious}
          onNext={(data) => {
            setStep2Data(data);
            goToNext();
          }}
        />
      )}
      {activeStep === 2 && step1Data && step2Data && (
        <Step3 config={step1Data} metadata={step2Data} onPrev={goToPrevious} />
      )}
    </Container>
  );
};

interface Step1Form {
  size: number;
  tokens: {
    address: string;
  }[];
}

interface Step1Props {
  onNext: (data: Step1Form) => void;
}

const Step1 = ({ onNext }: Step1Props) => {
  const { connection } = useConnection();
  const [lamports, setLamports] = useState<number>();
  const methods = useForm<Step1Form>({});
  const fieldArray = useFieldArray({
    control: methods.control,
    name: "tokens",
  });
  const size = methods.watch("size");

  useEffect(() => {
    async function fetchCost() {
      const canopyDepth = size - 3;
      const space = getConcurrentMerkleTreeAccountSize(size, 64, canopyDepth);
      const lamports = await connection.getMinimumBalanceForRentExemption(
        space
      );
      setLamports(lamports);
    }

    if (size) {
      fetchCost();
    }
  }, [connection, size]);

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => onNext(data))}
    >
      <Text mb="8">
        This is the first step in creating a community. Select the size of
        merkle tree you want to use. In future, you will be able to migrate to a
        larger tree if your forum reaches max capacity.
      </Text>

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

      <Divider my="8" />

      <Text mb="8">
        Optionally select one or more NFT collections or spl-token mints to act
        as a token gate for the community. Only users who own one of these NFTs
        or tokens will be able to join the community. For NFTs please enter a
        verified collection address.
      </Text>

      <Button
        width="100%"
        variant="outline"
        onClick={() => fieldArray.append({ address: "" })}
      >
        Add Token Gate
      </Button>

      {fieldArray.fields.map((field, index) => (
        <Box key={field.id} display="flex" alignItems="center" gap="2" my="4">
          <Input
            placeholder="Token Address"
            isInvalid={Boolean(methods.formState.errors.tokens?.[index])}
            {...methods.register(`tokens.${index}.address`, {
              required: true,
              validate: (value) => {
                try {
                  new web3.PublicKey(value);
                  return true;
                } catch (err) {
                  return "Invalid address";
                }
              },
            })}
          />
          <IconButton
            aria-label="Remove field"
            borderRadius="sm"
            onClick={() => fieldArray.remove(index)}
          >
            <IoTrash />
          </IconButton>
        </Box>
      ))}

      <Divider my="8" />

      <Box display="flex" justifyContent="flex-end" gap="2" my="8">
        <Button type="submit">Next</Button>
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
  onNext: (data: Step2Form) => void;
  onPrev: () => void;
}

const Step2 = ({ onNext, onPrev }: Step2Props) => {
  const methods = useForm<Step2Form>();

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => onNext(data))}
    >
      <Text mb="8">
        Add a slug, name and description for your community. You can also upload
        a logo and banner image.
      </Text>

      <FormControl mb="6">
        <FormLabel>Name</FormLabel>
        <Input
          placeholder="Enter name"
          {...methods.register("name", { required: true })}
        />
      </FormControl>

      <FormControl mb="6">
        <FormLabel>Description</FormLabel>
        <Textarea
          placeholder="Enter description"
          {...methods.register("description", { required: true })}
        />
      </FormControl>

      <Box
        display="flex"
        flexDirection={{
          base: "column",
          md: "row",
        }}
        gap="4"
        mt="6"
      >
        <Box flex={0}>
          <FormControl>
            <FormLabel>Logo</FormLabel>
            <Controller
              name="logo"
              control={methods.control}
              render={({ field }) => (
                <Box height="200px" width="200px">
                  <ImagePicker
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </Box>
              )}
            />
          </FormControl>
        </Box>
        <Box flex={1}>
          <FormControl>
            <FormLabel>Banner</FormLabel>
            <Controller
              name="banner"
              control={methods.control}
              render={({ field }) => (
                <ImagePicker
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormControl>
        </Box>
      </Box>

      <Divider my="8" />

      <Box display="flex" justifyContent="flex-end" gap="2" my="8">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button type="submit">Next</Button>
      </Box>
    </Box>
  );
};

interface Step3Props {
  config: Step1Form;
  metadata: Step2Form;
  onPrev: () => void;
}

const Step3 = ({ config, metadata, onPrev }: Step3Props) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const namespaceMutation = useMutation<
    void,
    unknown,
    { merkleTree: web3.PublicKey; uri: string }
  >(async ({ merkleTree, uri }) => {
    if (!anchorWallet) {
      throw new Error("Wallet not connected");
    }

    return createNamepace(
      connection,
      anchorWallet,
      merkleTree,
      metadata.name,
      uri
    );
  });

  const metadataUploadMutation = useMutation(
    async (_merkleTree: web3.PublicKey) => {
      return upload(
        wallet,
        null,
        JSON.stringify({
          name: metadata.name,
          description: metadata.description,
          logo: metadata.logo,
          banner: metadata.banner,
        }),
        "application/json"
      );
    },
    {
      onSuccess: (uri, merkleTree) => {
        namespaceMutation.mutate({ merkleTree, uri });
      },
    }
  );

  const initForumMutation = useMutation(
    async () => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }
      return initForum(connection, anchorWallet, config.size, 64);
    },
    {
      onSuccess: (merkleTree) => {
        metadataUploadMutation.mutate(merkleTree);
      },
    }
  );

  if (initForumMutation.isIdle) {
    return (
      <Box>
        <Heading size="md" mt="12" mb="8">
          Summary
        </Heading>

        <Card>
          <CardBody>
            <Text fontSize="sm" color="whiteAlpha.500">
              Name
            </Text>
            <Text mb="4">{metadata.name}</Text>
            <Text fontSize="sm" color="whiteAlpha.500">
              Description
            </Text>
            <Text mb="4">{metadata.description}</Text>
            <Text fontSize="sm" color="whiteAlpha.500">
              Capacity
            </Text>
            <Text mb="4">{1 << config.size}</Text>
            <Text fontSize="sm" color="whiteAlpha.500">
              Token Gates
            </Text>
            {config.tokens.length ? (
              config.tokens.map((token) => (
                <Text key={token.address}>{token.address}</Text>
              ))
            ) : (
              <Text>None</Text>
            )}
          </CardBody>
        </Card>

        <Box display="flex" justifyContent="flex-end" gap="2" my="8">
          <Button variant="outline" onClick={onPrev}>
            Back
          </Button>
          <Button variant="solid" onClick={() => initForumMutation.mutate()}>
            Confirm
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box py="12">
      <Text mb="2">Initializing Forum&hellip;</Text>
      <Progress
        size="xs"
        isIndeterminate
        isAnimated={
          !initForumMutation.error &&
          !metadataUploadMutation.error &&
          !namespaceMutation.error
        }
      />

      {initForumMutation.error ? (
        <Box display="flex" justifyContent="center">
          <Text textAlign="center">Failed to initalize forum</Text>
          <Button onClick={() => initForumMutation.mutate()}>Retry</Button>
        </Box>
      ) : null}

      {metadataUploadMutation.error ? (
        <Box display="flex" justifyContent="center">
          <Text textAlign="center">Failed to upload forum metadata</Text>
          {initForumMutation.data ? (
            <Button
              onClick={() =>
                metadataUploadMutation.mutate(initForumMutation.data)
              }
            >
              Retry
            </Button>
          ) : null}
        </Box>
      ) : null}

      {namespaceMutation.error ? (
        <Box display="flex" justifyContent="center">
          <Text textAlign="center">Failed to create namespace</Text>
          {metadataUploadMutation.data && initForumMutation.data ? (
            <Button
              onClick={() =>
                namespaceMutation.mutate({
                  merkleTree: initForumMutation.data,
                  uri: metadataUploadMutation.data,
                })
              }
            >
              Retry
            </Button>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

export default New;
