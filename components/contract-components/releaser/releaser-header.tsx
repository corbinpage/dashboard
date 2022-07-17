import { useReleaserProfile } from "../hooks";
import { EditProfile } from "./edit-profile";
import { ReleaserSocials } from "./releaser-socials";
import { Flex } from "@chakra-ui/react";
import { useAddress } from "@thirdweb-dev/react";
import { ChakraNextImage } from "components/Image";
import { useRouter } from "next/router";
import { Heading, Link, Text } from "tw-components";
import { shortenAddress } from "utils/usedapp-external";

interface ReleaserHeaderProps {
  wallet: string;
  page?: boolean;
}

export const ReleaserHeader: React.FC<ReleaserHeaderProps> = ({
  wallet,
  page,
}) => {
  const releaserProfile = useReleaserProfile(wallet);
  const address = useAddress();
  const router = useRouter();
  const isProfilePage = router.pathname === "/contracts/[wallet]";

  return (
    <Flex
      flexDirection={{ base: "column", md: page ? "column" : "row" }}
      justifyContent="space-between"
    >
      <Flex direction="column" gap={4}>
        <Heading size="title.sm">
          {isProfilePage ? "Author" : "Released by"}
        </Heading>
        <Flex gap={4} alignItems="top">
          <ChakraNextImage
            alt=""
            boxSize={12}
            mt={1}
            src={require("public/assets/others/hexagon.png")}
          />
          <Flex flexDir="column">
            <Link href={`/contracts/${wallet}`}>
              <Heading size="subtitle.sm" ml={2}>
                {/* TODO resolve ENS name */}
                {releaserProfile?.data?.name || shortenAddress(wallet)}
              </Heading>
            </Link>
            {isProfilePage && releaserProfile?.data?.bio && (
              <Text ml={2} noOfLines={2}>
                {releaserProfile.data.bio}
              </Text>
            )}
            {releaserProfile?.data && (
              <ReleaserSocials releaserProfile={releaserProfile.data} />
            )}
          </Flex>
        </Flex>
      </Flex>
      {wallet === address &&
        router.pathname === "/contracts/[wallet]" &&
        releaserProfile?.data && (
          <EditProfile releaserProfile={releaserProfile.data} />
        )}
    </Flex>
  );
};