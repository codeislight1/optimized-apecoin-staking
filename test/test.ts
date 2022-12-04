import { test, Variables } from "./common";

export let vars: Variables = {
	amountNFTsToMint: 10,
	amountApecoinsToStake: 1,
	amountApecoinToDepositWithNFTs: 1,
	numberOfNFTsToSingleDeposit: 5,
	numberOfNFTsToPairDeposit: 5,
	numbersOfIterations: 1, // number of iterations to repeat unit test with same contract deployment
	timeInBetween: 3600, // time between deposit and claim
};
if (
	vars.numberOfNFTsToPairDeposit + vars.numberOfNFTsToSingleDeposit >
	vars.amountNFTsToMint
)
	throw Error(
		"amountNFTsToMint must be greater (numberOfNFTsToSingleDeposit + numberOfNFTsToPairDeposit)"
	);
test("ApeCoinStaking", "Unoptimized contract", vars);
test("OptimizedApeCoinStaking", "Optimized contract", vars);
