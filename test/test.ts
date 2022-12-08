import { test, Variables } from "./common";

export let vars: Variables = {
	amountNFTsToMint: 10,
	numbersOfIterations: 10, // number of iterations to repeat unit test with same contract deployment
	timeInBetween: 3600, // time between deposit and claim
};
if (vars.amountNFTsToMint < 1)
	throw Error("amount NFTs must to be minted, must be equal or greater than 1");
test("ApeCoinStaking", "Unoptimized contract", vars);
test("OptimizedApeCoinStaking", "Optimized contract", vars);
