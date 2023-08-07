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

import { initForumAndNamespace } from "lib/anchor";
import { ContentType, upload } from "lib/bundlr";
import { ImagePicker } from "components/input/imagePicker";
import { findNamespacePda } from "utils/pda";

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
  namespace: string;
  displayName: string;
  description: string;
  icon: File | null;
  banner: File | null;
}

interface Step2Props {
  onNext: (data: Step2Form) => void;
  onPrev: () => void;
}

const Step2 = ({ onNext, onPrev }: Step2Props) => {
  const { connection } = useConnection();
  const methods = useForm<Step2Form>();

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => onNext(data))}
    >
      <Text mb="8">
        Add a namespace, display name and description for your community. You
        can also upload a logo and banner image.
      </Text>

      <FormControl mb="6">
        <FormLabel>Namespace</FormLabel>
        <Input
          placeholder="Enter namespace"
          isInvalid={Boolean(methods.formState.errors.namespace)}
          {...methods.register("namespace", {
            required: true,
            pattern: /^[a-z0-9]+$/,
            validate: {
              maxLength: (value) => {
                if (Buffer.from(value).byteLength > 32) {
                  return "Namespace is too long";
                }
                return true;
              },
              async unique(value) {
                const namespacePda = await findNamespacePda(value);
                const accountInfo = await connection.getAccountInfo(
                  namespacePda
                );
                if (accountInfo) {
                  return `${value} is already taken`;
                }
                return true;
              },
            },
          })}
        />
        <FormHelperText>
          {typeof methods.formState.errors.namespace?.message === "string" &&
          methods.formState.errors.namespace.message.length
            ? methods.formState.errors.namespace?.message
            : "No spaces or symbols allowed"}
        </FormHelperText>
      </FormControl>

      <FormControl mb="6">
        <FormLabel>Display Name</FormLabel>
        <Input
          placeholder="Enter display name"
          isInvalid={Boolean(methods.formState.errors.displayName)}
          {...methods.register("displayName", { required: true })}
        />
      </FormControl>

      <FormControl mb="6">
        <FormLabel>Description</FormLabel>
        <Textarea
          placeholder="Enter description"
          isInvalid={Boolean(methods.formState.errors.description)}
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
            <FormLabel>Icon</FormLabel>
            <Controller
              name="icon"
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
        <Button type="submit" isLoading={methods.formState.isValidating}>
          Next
        </Button>
      </Box>
    </Box>
  );
};

interface Step3Props {
  config: Step1Form;
  metadata: Step2Form;
  onPrev: () => void;
}

interface ForumJsonMetadata {
  namespace: string;
  displayName: string;
  description: string;
  icon?: string;
  banner?: string;
}

const Step3 = ({ config, metadata, onPrev }: Step3Props) => {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const initMutation = useMutation(
    async (uri: string) => {
      if (!anchorWallet) {
        throw new Error("Wallet not connected");
      }
      return initForumAndNamespace(
        connection,
        anchorWallet,
        config.size,
        64,
        metadata.namespace,
        uri
      );
    },
    {
      async onSuccess() {
        router.push(`/o/${metadata.namespace}`);
      },
    }
  );

  const metadataUploadMutation = useMutation(
    async () => {
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      const json: ForumJsonMetadata = {
        namespace: metadata.namespace,
        displayName: metadata.displayName,
        description: metadata.description,
      };

      if (metadata.icon) {
        const buffer = Buffer.from(await metadata.icon.arrayBuffer());

        const iconUri = await upload(
          wallet,
          null,
          buffer,
          metadata.icon.type as ContentType
        );
        json.icon = iconUri;
      }

      if (metadata.banner) {
        const buffer = Buffer.from(await metadata.banner.arrayBuffer());

        const bannerUri = await upload(
          wallet,
          null,
          buffer,
          metadata.banner.type as ContentType
        );
        json.banner = bannerUri;
      }

      return upload(wallet, null, JSON.stringify(json), "application/json");
    },
    {
      onSuccess: (uri) => {
        initMutation.mutate(uri);
      },
    }
  );

  if (metadataUploadMutation.isIdle) {
    return (
      <Box>
        <Heading size="md" mt="12" mb="8">
          Summary
        </Heading>

        <Card>
          <CardBody>
            <Text fontSize="sm" color="whiteAlpha.500">
              Namespace
            </Text>
            <Text mb="4">{metadata.namespace}</Text>
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
          <Button
            variant="solid"
            onClick={() => metadataUploadMutation.mutate()}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    );
  }

  function getMessage() {
    if (metadataUploadMutation.isLoading) {
      return "Uploading metadata";
    }
    if (initMutation.isLoading) {
      return "Initializing forum";
    }
  }

  return (
    <Box py="12">
      <Text mb="2">{getMessage()}&hellip;</Text>
      <Progress
        size="xs"
        isIndeterminate
        isAnimated={!initMutation.error && !metadataUploadMutation.error}
      />

      {initMutation.error ? (
        <Box display="flex" justifyContent="center">
          <Text textAlign="center">Failed to initalize forum</Text>
          {metadataUploadMutation.data ? (
            <Button
              onClick={() => initMutation.mutate(metadataUploadMutation.data)}
            >
              Retry
            </Button>
          ) : null}
        </Box>
      ) : null}

      {metadataUploadMutation.error ? (
        <Box display="flex" justifyContent="center">
          <Text textAlign="center">Failed to upload forum metadata</Text>
          <Button onClick={() => metadataUploadMutation.mutate()}>Retry</Button>
        </Box>
      ) : null}
    </Box>
  );
};

export default New;
