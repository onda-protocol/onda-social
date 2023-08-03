import {
  Button,
  Modal as ChakraModal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onRequestClose: () => void;
}

export const Modal = ({ children, isOpen, onRequestClose }: ModalProps) => {
  return (
    <ChakraModal isOpen={isOpen} onClose={onRequestClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modal Title</ModalHeader>
        <ModalBody>{children}</ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onRequestClose}>
            Close
          </Button>
          <Button variant="ghost">Submit</Button>
        </ModalFooter>
      </ModalContent>
    </ChakraModal>
  );
};
