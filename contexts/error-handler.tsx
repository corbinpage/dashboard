import {
  Button,
  Code,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Heading,
  Icon,
  Text,
  useBreakpointValue,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { TransactionError } from "@thirdweb-dev/sdk";
import { LinkButton } from "components/shared/LinkButton";
import { AddressCopyButton } from "components/web3/AddressCopyButton";
import { createContext, useCallback, useContext, useState } from "react";
import { FiAlertTriangle, FiCheck } from "react-icons/fi";
import { ImCopy } from "react-icons/im";
import { SiDiscord } from "react-icons/si";
import { ComponentWithChildren } from "types/component-with-children";
import { parseErrorToMessage } from "utils/errorParser";

interface ErrorContext {
  onError: (error: unknown, errorTitle?: string) => void;
  dismissError: () => void;
}

const ErrorContext = createContext<ErrorContext>({
  onError: () => undefined,
  dismissError: () => undefined,
});

type EnhancedTransactionError = TransactionError & {
  title: string;
};

export const ErrorProvider: ComponentWithChildren = ({ children }) => {
  const toast = useToast();
  const [currentError, setCurrentError] = useState<EnhancedTransactionError>();
  const dismissError = useCallback(() => setCurrentError(undefined), []);
  const onError = useCallback((err: unknown, title = "An error occurred") => {
    if (isTransactionError(err)) {
      (err as any).title = title;
      setCurrentError(err as EnhancedTransactionError);
    } else {
      toast({
        title,
        description: parseErrorToMessage(err),
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { onCopy, hasCopied } = useClipboard(currentError?.message || "");
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <>
      <Drawer
        placement={isMobile ? "bottom" : "right"}
        size="md"
        isOpen={!!currentError}
        onClose={dismissError}
      >
        <DrawerOverlay zIndex="modal" />
        <DrawerContent
          overflow="hidden"
          borderTopRadius={{ base: "lg", md: "none" }}
        >
          <DrawerCloseButton />
          <DrawerBody py={{ base: 4 }}>
            <Flex direction="column" gap={4}>
              <Flex direction="row" gap={1} align="center">
                <Icon boxSize={5} as={FiAlertTriangle} color="red.500" />
                <Heading size="subtitle.md">
                  Error: Failed to send transaction
                </Heading>
              </Flex>
              <Flex direction="column" gap={2}>
                <Heading size="label.md">Sender</Heading>
                <AddressCopyButton address={currentError?.from} />
              </Flex>
              <Flex direction="column" gap={2}>
                <Heading size="label.md">Recipient</Heading>
                <AddressCopyButton address={currentError?.to} />
              </Flex>
              <Flex direction="column" gap={2}>
                <Heading size="label.md">Network / Chain</Heading>
                <Text>
                  {currentError?.chain.name} ({currentError?.chain.chainId})
                </Text>
              </Flex>
              <Flex direction="column" gap={2}>
                <Heading size="label.md">Root cause</Heading>
                <Code px={4} py={2} borderRadius="md" whiteSpace="pre-wrap">
                  {currentError?.reason}
                </Code>
              </Flex>
              <Divider my={2} borderColor="borderColor" />
              <Heading size="subtitle.md">Need help with this error?</Heading>
              <LinkButton
                colorScheme="discord"
                isExternal
                noIcon
                href="https://discord.gg/thirdweb"
                leftIcon={<Icon boxSize="1rem" as={SiDiscord} />}
              >
                Join our Discord
              </LinkButton>
              <Button
                onClick={onCopy}
                leftIcon={
                  <Icon boxSize={3} as={hasCopied ? FiCheck : ImCopy} />
                }
              >
                {hasCopied ? "Copied!" : "Copy error to clipboard"}
              </Button>
              <Text fontStyle="italic">
                Copying the error message will let you report this error with
                all its details to our team.
              </Text>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ErrorContext.Provider
        value={{
          onError,
          dismissError,
        }}
      >
        {children}
      </ErrorContext.Provider>
    </>
  );
};

export function useErrorHandler() {
  return useContext(ErrorContext);
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isTransactionError(error: unknown): error is TransactionError {
  return error instanceof TransactionError;
}