import {
  useSplitBalances,
  useSplitDistributeFunds,
} from "@3rdweb-sdk/react/hooks/useSplit";
import { UseContractResult } from "@thirdweb-dev/react";
import { SplitImpl } from "@thirdweb-dev/sdk/dist/declarations/src/contracts/prebuilt-implementations/split";
import { MismatchButton } from "components/buttons/MismatchButton";
import { TransactionButton } from "components/buttons/TransactionButton";
import { useMemo } from "react";
import { Button } from "tw-components";

export interface DistributeButtonProps {
  contractQuery?: UseContractResult<SplitImpl>;
  balances: ReturnType<typeof useSplitBalances>;
}

export const DistributeButton: React.FC<DistributeButtonProps> = ({
  contractQuery,
  balances,
  ...restButtonProps
}) => {
  const numTransactions = useMemo(() => {
    if (!balances.data || balances.isLoading) {
      return 0;
    }
    return balances.data.filter((b) => b.display_balance !== "0.0").length;
  }, [balances.data, balances.isLoading]);

  const distibutedFundsMutation = useSplitDistributeFunds(
    contractQuery?.contract,
  );

  if (balances.isError) {
    // if we fail to get the balances, we can't know how many transactions there are going to be
    // we still want to show the button, so we'll just show the mismatch button
    return (
      <MismatchButton
        isLoading={distibutedFundsMutation.isLoading}
        colorScheme="primary"
        onClick={() => distibutedFundsMutation.mutate()}
        {...restButtonProps}
      >
        Distribute Funds
      </MismatchButton>
    );
  }

  if (numTransactions === 0) {
    return (
      <Button isDisabled colorScheme="primary" {...restButtonProps}>
        Nothing to distribute
      </Button>
    );
  }

  return (
    <TransactionButton
      transactionCount={numTransactions}
      isLoading={balances.isLoading || distibutedFundsMutation.isLoading}
      colorScheme="primary"
      onClick={() => distibutedFundsMutation.mutate()}
      {...restButtonProps}
    >
      Distribute Funds
    </TransactionButton>
  );
};
