import {
  Box,
  HStack,
  useRadio,
  useRadioGroup,
  UseRadioGroupReturn,
} from "@chakra-ui/react";

interface RadioCardMenuProps {
  name: string;
  defaultValue: string;
  options: { label: string; value: string; icon: React.ReactNode }[];
  onChange: (value: string) => void;
}

export const RadioCardMenu: React.FC<RadioCardMenuProps> = ({
  options,
  name,
  defaultValue,
  onChange,
}) => {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name,
    defaultValue,
    onChange,
  });

  const group = getRootProps();

  return (
    <HStack {...group} spacing="0" width="100%">
      {options.map((option) => {
        const radio = getRadioProps({ value: option.value });
        return (
          <RadioCard key={option.value} {...radio}>
            <Box display="flex" dir="row" alignItems="center">
              <Box mr={2}>{option.icon}</Box>
              {option.label}
            </Box>
          </RadioCard>
        );
      })}
    </HStack>
  );
};

// 1. Create a component that consumes the `useRadio` hook
export const RadioCard: React.FC<
  ReturnType<UseRadioGroupReturn["getRadioProps"]>
> = (props) => {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box
      as="label"
      flex="1"
      borderColor="inherit"
      borderWidth="1px"
      borderTopLeftRadius="inherit"
      borderBottomLeftRadius="inherit"
      borderTopRightRadius="inherit"
      borderBottomRightRadius="inherit"
      sx={{
        "&:first-of-type": {
          borderTopLeftRadius: "sm",
        },
        "&:last-of-type": {
          borderTopRightRadius: "sm",
          borderLeftWidth: "0",
        },
      }}
    >
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        boxShadow="md"
        _hover={{
          bg: "whiteAlpha.100",
        }}
        _checked={{
          bg: "whiteAlpha.200",
        }}
        _focus={{
          bg: "whiteAlpha.300",
        }}
        px={5}
        py={3}
      >
        {props.children}
      </Box>
    </Box>
  );
};
