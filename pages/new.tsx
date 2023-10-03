import type { NextPage } from "next";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  Controller,
  UseFormReturn,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { IoTrash } from "react-icons/io5";
import { BN, web3 } from "@project-serum/anchor";
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
  ListItem,
  List,
} from "@chakra-ui/react";
import { getConcurrentMerkleTreeAccountSize } from "@solana/spl-account-compression";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Gate, initForumAndNamespace } from "lib/anchor";
import { ContentType, webUpload } from "lib/bundlr";
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
          data={step1Data}
          onNext={(data) => {
            setStep1Data(data);
            goToNext();
          }}
        />
      )}
      {activeStep === 1 && (
        <Step2
          data={step2Data}
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
  gates: {
    type: "token" | "nft";
    address: string;
    amount?: number;
  }[];
}

interface Step1Props {
  data?: Step1Form;
  onNext: (data: Step1Form) => void;
}

const Step1 = ({ data, onNext }: Step1Props) => {
  const { connection } = useConnection();
  const methods = useForm<Step1Form>({ defaultValues: data });
  const fieldArray = useFieldArray({
    control: methods.control,
    name: "gates",
  });
  const size = methods.watch("size");

  const costQuery = useQuery(
    ["merkle_tree_cost", size],
    async () => {
      const canopyDepth = size - 5;
      const space = getConcurrentMerkleTreeAccountSize(size, 64, canopyDepth);
      return connection.getMinimumBalanceForRentExemption(space);
    },
    {
      enabled: Boolean(size),
    }
  );
  const lamports = costQuery.data;

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
        onClick={() =>
          fieldArray.append({ address: "", type: "nft", amount: 1 })
        }
      >
        Add Token Gate
      </Button>

      {fieldArray.fields.map((field, index) => (
        <TokenGateField
          key={field.id}
          index={index}
          methods={methods}
          onRemove={() => fieldArray.remove(index)}
        />
      ))}

      <Divider my="8" />

      <Box display="flex" justifyContent="flex-end" gap="2" my="8">
        <Button type="submit" variant="primary">
          Next
        </Button>
      </Box>
    </Box>
  );
};

interface TokenGateFieldProps {
  index: number;
  methods: UseFormReturn<Step1Form>;
  onRemove: () => void;
}

const TokenGateField = ({ index, methods, onRemove }: TokenGateFieldProps) => {
  const field = useWatch({
    control: methods.control,
    name: `gates.${index}`,
  });

  return (
    <Box display="flex" alignItems="center" gap="2" my="4">
      <Input
        placeholder={field.type === "nft" ? "Collection Address" : "Token Mint"}
        isInvalid={Boolean(methods.formState.errors.gates?.[index]?.address)}
        {...methods.register(`gates.${index}.address`, {
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
      <GateAmountInput index={index} methods={methods} />
      <Select
        placeholder="Type"
        width="100px"
        minWidth="100px"
        {...methods.register(`gates.${index}.type`, {
          required: true,
        })}
      >
        <option value="nft">NFT</option>
        <option value="token">Token</option>
      </Select>
      <IconButton
        aria-label="Remove field"
        borderRadius="sm"
        onClick={onRemove}
      >
        <IoTrash />
      </IconButton>
    </Box>
  );
};

interface GateAmountInput {
  index: number;
  methods: UseFormReturn<Step1Form>;
}

const GateAmountInput = ({ index, methods }: GateAmountInput) => {
  const typeValue = useWatch({
    control: methods.control,
    name: `gates.${index}.type`,
  });

  useEffect(() => {
    if (typeValue === "nft") {
      methods.setValue(`gates.${index}.amount`, 1);
    }
  }, [index, methods, typeValue]);

  if (typeValue !== "token") {
    return null;
  }

  return (
    <Input
      type="number"
      width="120px"
      minWidth="120px"
      placeholder="Amount"
      disabled={typeValue !== "token"}
      isInvalid={Boolean(methods.formState.errors.gates?.[index]?.amount)}
      {...methods.register(`gates.${index}.amount`, {
        required: true,
        validate: (value) => !isNaN(Number(value)) && Number(value) > 0,
      })}
    />
  );
};

interface Step2Form {
  namespace: string;
  displayName: string;
  description: string;
  links: {
    name: string;
    url: string;
  }[];
  icon: File | null;
  banner: File | null;
}

interface Step2Props {
  data?: Step2Form;
  onNext: (data: Step2Form) => void;
  onPrev: () => void;
}

const Step2 = ({ data, onNext, onPrev }: Step2Props) => {
  const { connection } = useConnection();
  const methods = useForm<Step2Form>({
    defaultValues: data,
  });
  const fieldArray = useFieldArray({
    control: methods.control,
    name: "links",
  });

  return (
    <Box
      noValidate
      as="form"
      onSubmit={methods.handleSubmit((data) => onNext(data))}
    >
      <Text mb="8">
        Add a namespace, display name and description for your community. You
        can also upload an icon and banner image.
      </Text>

      <FormControl mb="6">
        <FormLabel>Namespace</FormLabel>
        <Input
          placeholder="Enter namespace"
          isInvalid={Boolean(methods.formState.errors.namespace)}
          {...methods.register("namespace", {
            required: true,
            pattern: /^[a-zA-Z0-9]+$/,
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
            : "Case sensitive, no spaces or symbols"}
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

      <Button
        width="100%"
        variant="outline"
        onClick={() => fieldArray.append({ name: "", url: "" })}
      >
        Add Link
      </Button>

      {fieldArray.fields.map((field, index) => (
        <LinkField
          key={field.id}
          index={index}
          methods={methods}
          onRemove={() => fieldArray.remove(index)}
        />
      ))}

      <Divider my="8" />

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
        <Button
          type="submit"
          variant="primary"
          isLoading={methods.formState.isValidating}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

interface LinkFieldProps {
  index: number;
  methods: UseFormReturn<Step2Form>;
  onRemove: () => void;
}

const LinkField = ({ index, methods, onRemove }: LinkFieldProps) => {
  const field = useWatch({
    control: methods.control,
    name: `links.${index}`,
  });

  return (
    <Box display="flex" alignItems="center" gap="2" my="4">
      <Input
        placeholder="Name"
        isInvalid={Boolean(methods.formState.errors.links?.[index]?.name)}
        {...methods.register(`links.${index}.name`, {
          required: true,
        })}
      />
      <Input
        placeholder="Url"
        isInvalid={Boolean(methods.formState.errors.links?.[index]?.url)}
        {...methods.register(`links.${index}.url`, {
          required: true,
          pattern: /^(https?|ipfs):\/\/[^\s$.?#].[^\s]*$/gm,
        })}
      />
      <IconButton
        aria-label="Remove field"
        borderRadius="sm"
        onClick={onRemove}
      >
        <IoTrash />
      </IconButton>
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
  links?: { name: string; url: string }[];
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

      const gates: Gate[] = config.gates.map((gate) => {
        if (gate.type === "nft") {
          return {
            amount: new BN(1),
            address: [new web3.PublicKey(gate.address)],
            ruleType: {
              nft: {},
            },
            operator: {
              or: {},
            },
          };
        }
        return {
          amount: new BN(gate.amount!),
          address: [new web3.PublicKey(gate.address)],
          ruleType: {
            token: {},
          },
          operator: {
            or: {},
          },
        };
      });

      return initForumAndNamespace(
        connection,
        anchorWallet,
        config.size,
        64, // buffer size
        metadata.namespace,
        uri,
        gates
      );
    },
    {
      async onSuccess(data) {
        console.log("=====> ", data);
        // TODO wait for forum
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

      if (metadata.links?.length) {
        json.links = metadata.links;
      }

      if (metadata.icon) {
        const buffer = Buffer.from(await metadata.icon.arrayBuffer());

        const iconUri = await webUpload(
          wallet,
          buffer,
          metadata.icon.type as ContentType
        );
        json.icon = iconUri;
      }

      if (metadata.banner) {
        const buffer = Buffer.from(await metadata.banner.arrayBuffer());

        const bannerUri = await webUpload(
          wallet,
          buffer,
          metadata.banner.type as ContentType
        );
        json.banner = bannerUri;
      }

      return webUpload(wallet, JSON.stringify(json), "application/json");
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
            <Text fontSize="md" color="whiteAlpha.500">
              Namespace
            </Text>
            <Text mb="4">{metadata.namespace}</Text>
            <Text fontSize="md" color="whiteAlpha.500">
              Description
            </Text>
            <Text mb="4">{metadata.description}</Text>
            <Text fontSize="md" color="whiteAlpha.500">
              Capacity
            </Text>
            <Text mb="4">{1 << config.size}</Text>

            <Text fontSize="md" color="whiteAlpha.500">
              Token Gates
            </Text>
            {config.gates.length ? (
              <List mt="4" px="1">
                {config.gates.map((gate, index) => (
                  <ListItem key={gate.address}>
                    <Text fontSize="sm" color="whiteAlpha.500">
                      {index + 1}.&nbsp;
                      {gate.type === "nft" ? "NFT Collection" : "SPL Token"}
                    </Text>
                    <Text mb="2" pl="3">
                      {gate.address}
                    </Text>
                    {gate.type === "token" && (
                      <Box pl="3">
                        <Text fontSize="sm" color="whiteAlpha.500">
                          Token Amount
                        </Text>
                        <Text mb="2">{gate.amount}</Text>
                      </Box>
                    )}
                    {index !== config.gates.length - 1 && (
                      <Box my="4" mx="3">
                        <Divider borderColor="whiteAlpha.200" />
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
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
            variant="primary"
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
      {!initMutation.error && !metadataUploadMutation.error ? (
        <>
          <Text mb="2">{getMessage()}&hellip;</Text>
          <Progress
            size="xs"
            isIndeterminate
            isAnimated={!initMutation.error && !metadataUploadMutation.error}
          />
        </>
      ) : null}

      {initMutation.error ? (
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Text fontSize="lg" textAlign="center">
            Failed to initalize forum
          </Text>
          {metadataUploadMutation.data ? (
            <Box display="flex" justifyContent="center" p="6">
              <Button
                onClick={() => initMutation.mutate(metadataUploadMutation.data)}
              >
                Retry
              </Button>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {metadataUploadMutation.error ? (
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Text fontSize="lg" textAlign="center">
            Failed to upload forum metadata
          </Text>
          <Box display="flex" justifyContent="center" p="6">
            <Button onClick={() => metadataUploadMutation.mutate()}>
              Retry
            </Button>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default New;
