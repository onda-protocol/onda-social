import Image from "next/image";
import { Box, Text } from "@chakra-ui/react";
import Dropzone from "react-dropzone";
import { IoImage } from "react-icons/io5";
import { useEffect, useState } from "react";

interface ImagePickerProps {
  name: string;
  value: File | null;
  onChange: (file: File) => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  name,
  value,
  onChange,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    height: number;
    width: number;
  }>();

  useEffect(() => {
    if (value) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          const image = document.createElement("img");
          image.onload = () => {
            setDataUrl(result as string);
            setDimensions({
              height: image.height,
              width: image.width,
            });
          };
          image.src = result as string;
        }
      };
      reader.readAsDataURL(value);
    }
  }, [value]);

  return (
    <Dropzone onDrop={(acceptedFiles) => onChange(acceptedFiles[0])}>
      {({ getRootProps, getInputProps }) => (
        <Box
          aria-label={name}
          minHeight="200px"
          border="1px"
          borderStyle="dotted"
          borderColor="whiteAlpha.300"
          my="4"
          cursor="pointer"
          _hover={{
            bgColor: "whiteAlpha.50",
            borderColor: "whiteAlpha.300",
          }}
          {...getRootProps()}
        >
          <input
            {...getInputProps({
              name,
              accept: ".png, .jpeg, .webp, .gif",
            })}
          />
          {dataUrl ? (
            <Box position="relative" overflow="hidden">
              <Box>
                <Image
                  fill
                  unoptimized
                  src={dataUrl}
                  alt="preview background"
                  style={{
                    zIndex: -1,
                    filter: "blur(20px) brightness(.8)",
                  }}
                />
              </Box>
              <Image
                unoptimized
                height={dimensions?.height}
                width={dimensions?.width}
                src={dataUrl}
                alt="preview"
                style={{
                  objectFit: "contain",
                  maxHeight: "512px",
                  maxWidth: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  zIndex: 0,
                }}
              />
            </Box>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="200px"
              padding="6"
              color="whiteAlpha.500"
            >
              <Box mb="4">
                <IoImage size="2em" />
              </Box>
              <Text color="inherit">
                Drag &apos;n&apos; drop some files here, or click to select
                files
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Dropzone>
  );
};
