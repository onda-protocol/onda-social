import {
  Modal as ChakraModal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalBody,
} from "@chakra-ui/react";

interface ModalProps {
  title?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onRequestClose: () => void;
}

export const Modal = ({
  title,
  children,
  isOpen,
  onRequestClose,
}: ModalProps) => {
  return (
    <ChakraModal size="xl" isOpen={isOpen} onClose={onRequestClose}>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent backgroundColor="onda.1000" alignSelf="center">
        {title && <ModalHeader>{title}</ModalHeader>}
        <ModalBody padding="0">{children}</ModalBody>
      </ModalContent>
    </ChakraModal>
  );
};
