import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers, network } from "hardhat";
import { describe } from "mocha";

function secondsTilNextHour(now: Date): number {
	return 3600 - now.getSeconds() - now.getMinutes() * 60;
}
async function speedUp(time: number) {
	await network.provider.send("evm_increaseTime", [3600]);
	await network.provider.send("evm_mine");
}
export type Variables = {
	amountNFTsToMint: number;
	amountApecoinsToStake: number;
	amountApecoinToDepositWithNFTs: number;
	numberOfNFTsToSingleDeposit: number;
	numberOfNFTsToPairDeposit: number;
	numbersOfIterations: number;
	timeInBetween: number;
};

export const toWei = (amount: number) =>
	ethers.utils.parseEther(amount.toString());
enum NFT {
	BAYC,
	MAYC,
	BAKC,
}
let tokenIdTracker = {
	bayc: 0,
	mayc: 0,
	bakc: 0,
};
function tokenIdDeposit(nftDeposit: NFT) {
	let value;
	if (nftDeposit === NFT.BAYC) {
		value = tokenIdTracker.bayc;
		tokenIdTracker.bayc += 1;
	} else if (nftDeposit === NFT.MAYC) {
		value = tokenIdTracker.mayc;
		tokenIdTracker.mayc += 1;
	} else {
		value = tokenIdTracker.bakc;
		tokenIdTracker.bakc += 1;
	}
	return value;
}
export function test(contractName: string, title: string, vars: Variables) {
	describe(title + " testing", () => {
		let owner: SignerWithAddress,
			addr1: SignerWithAddress,
			addr2: SignerWithAddress,
			addrs: SignerWithAddress[];
		let stakingContract: Contract;
		let ape: Contract;
		let bayc: Contract;
		let mayc: Contract;
		let bakc: Contract;
		let START_TIME,
			END_FIRST_QUARTER,
			END_SECOND_QUARTER,
			END_THIRD_QUARTER,
			END_FOURTH_QUARTER;
		let QUARTERS: number[],
			BAYC_QUARTERS_AMOUNTS: number[],
			MAYC_QUARTERS_AMOUNTS: number[],
			BAKC_QUARTERS_AMOUNTS: number[];
		let APE_QUARTERS_AMOUNTS: number[];
		// first index value is 1 to test deposit
		const CAP_PERPOSITION = [toWei(1), toWei(10094), toWei(2042), toWei(856)];
		let TOTAL_QUARTERS_AMOUNTS: number[][];
		const tokenAmount = vars.amountApecoinsToStake;
		const tokenAmountWithNft = vars.amountApecoinToDepositWithNFTs;
		const nftNumbers = vars.numberOfNFTsToSingleDeposit;
		const nftPairNumbers = vars.numberOfNFTsToPairDeposit;
		before(async () => {
			tokenIdTracker = {
				bayc: 0,
				mayc: 0,
				bakc: 0,
			};
			const NINETY_ONE_DAYS_IN_SECONDS = 24 * 3600 * 91;
			const NINETY_TWO_DAYS_IN_SECONDS = 24 * 3600 * 92;
			const currentEthTimestamp = (await ethers.provider.getBlock("latest"))
				.timestamp;
			let now = new Date(currentEthTimestamp * 1000);

			START_TIME = currentEthTimestamp + secondsTilNextHour(now);

			END_FIRST_QUARTER = START_TIME + NINETY_ONE_DAYS_IN_SECONDS;
			END_SECOND_QUARTER = END_FIRST_QUARTER + NINETY_TWO_DAYS_IN_SECONDS;
			END_THIRD_QUARTER = END_SECOND_QUARTER + NINETY_ONE_DAYS_IN_SECONDS;
			END_FOURTH_QUARTER = END_THIRD_QUARTER + NINETY_ONE_DAYS_IN_SECONDS;
			QUARTERS = [
				START_TIME,
				END_FIRST_QUARTER,
				END_SECOND_QUARTER,
				END_THIRD_QUARTER,
				END_FOURTH_QUARTER,
			];
			APE_QUARTERS_AMOUNTS = [10_500_000, 9_000_000, 6_000_000, 4_500_000];
			BAYC_QUARTERS_AMOUNTS = [16_486_750, 14_131_500, 9_421_000, 7_065_750];
			MAYC_QUARTERS_AMOUNTS = [6_671_000, 5_718_000, 3_812_000, 2_859_000];
			BAKC_QUARTERS_AMOUNTS = [1_342_250, 1_150_500, 767_000, 575_250];
			TOTAL_QUARTERS_AMOUNTS = [
				APE_QUARTERS_AMOUNTS,
				BAYC_QUARTERS_AMOUNTS,
				MAYC_QUARTERS_AMOUNTS,
				BAKC_QUARTERS_AMOUNTS,
			];
			[owner, addr1, addr2, ...addrs] = await ethers.getSigners();
			let ERC20 = await ethers.getContractFactory("SimpleERC20");
			let ERC721 = await ethers.getContractFactory("SimpleERC721");
			ape = await ERC20.deploy("APE", "APE");
			await ape.deployed();
			bayc = await ERC721.deploy("BAYC", "BAYC", "", 10000);
			await bayc.deployed();
			mayc = await ERC721.deploy("MAYC", "MAYC", "", 10000);
			await mayc.deployed();
			bakc = await ERC721.deploy("BAKC", "BAKC", "", 10000);
			await bakc.deployed();
			await ape.mintOwner(owner.address, toWei(200000000));
		});
		describe("Unit Testing", () => {
			// iteration calls
			it("should deploy and assign contracts", async () => {
				let CONTRACT = await ethers.getContractFactory(contractName);
				stakingContract = await CONTRACT.deploy(
					ape.address,
					bayc.address,
					mayc.address,
					bakc.address
				);
				await stakingContract.deployed();
				expect(
					await ethers.provider
						.getCode(stakingContract.address)
						.then((res: string) => res.length)
				).to.be.greaterThan(0);
			});
			it("should prefund contract, users and setup range", async () => {
				let amount = toWei(175_000_000);
				await ape.transfer(stakingContract.address, amount);
				expect(await ape.balanceOf(stakingContract.address)).to.be.eq(amount);
				// minting NFTs
				let toBeMinted = vars.amountNFTsToMint;
				while (toBeMinted > 0) {
					let amount = toBeMinted > 10 ? 10 : toBeMinted;
					await bayc.mint(amount);
					await mayc.mint(amount);
					await bakc.mint(amount);
					toBeMinted -= amount;
				}
				// adding all ranges
				await stakingContract.addTimeRange(
					0,
					toWei(APE_QUARTERS_AMOUNTS[0]),
					QUARTERS[0],
					QUARTERS[1],
					CAP_PERPOSITION[0]
				);
				await stakingContract.removeLastTimeRange(0);

				TOTAL_QUARTERS_AMOUNTS.forEach((values, outerIndex) => {
					values.forEach(async (value, innerIndex) => {
						await stakingContract.addTimeRange(
							outerIndex,
							toWei(value),
							QUARTERS[innerIndex],
							QUARTERS[innerIndex + 1],
							CAP_PERPOSITION[outerIndex]
						);
					});
				});
			});
			//selfdeposit apecoin
			function operations() {
				for (let i = 0; i < vars.numbersOfIterations; i++) {
					it("self deposit apecoin", async () => {
						tokenIdTracker = {
							bayc: 0,
							mayc: 0,
							bakc: 0,
						};
						await ape.approve(
							stakingContract.address,
							ethers.constants.MaxUint256
						);
						await stakingContract.depositSelfApeCoin(toWei(tokenAmount));
					});
					//deposit BAYC
					it("deposit BAYC", async () => {
						let nfts = [];
						let tokenId;
						for (let i = 0; i < nftNumbers; i++) {
							tokenId = tokenIdDeposit(NFT.BAYC);
							let nft = {
								tokenId: tokenId,
								amount: toWei(tokenAmountWithNft),
							};
							nfts.push(nft);
						}
						await stakingContract.depositBAYC(nfts);
					});
					//deposit MAYC
					it("deposit MAYC", async () => {
						let nfts = [];
						let tokenId;
						for (let i = 0; i < nftNumbers; i++) {
							tokenId = tokenIdDeposit(NFT.MAYC);
							let nft = {
								tokenId: tokenId,
								amount: toWei(tokenAmountWithNft),
							};
							nfts.push(nft);
						}
						await stakingContract.depositMAYC(nfts);
					});
					//deposit BAKC
					it("deposit BAKC", async () => {
						let BaycNfts = [];
						let MaycNfts = [];
						let tokenIdMain;
						let tokenIdBakc;
						let nft;
						for (let i = 0; i < nftPairNumbers; i++) {
							tokenIdMain = tokenIdDeposit(NFT.BAYC);
							tokenIdBakc = tokenIdDeposit(NFT.BAKC);
							nft = {
								mainTokenId: tokenIdMain,
								bakcTokenId: tokenIdBakc,
								amount: toWei(tokenAmountWithNft),
							};
							BaycNfts.push(nft);
						}
						for (let i = 0; i < nftPairNumbers; i++) {
							tokenIdMain = tokenIdDeposit(NFT.MAYC);
							tokenIdBakc = tokenIdDeposit(NFT.BAKC);
							nft = {
								mainTokenId: tokenIdMain,
								bakcTokenId: tokenIdBakc,
								amount: toWei(tokenAmountWithNft),
							};
							MaycNfts.push(nft);
						}
						await stakingContract.depositBAKC(BaycNfts, MaycNfts);
					});
					it("speeds up time for 1 hour", async () => {
						await speedUp(vars.timeInBetween);
					});
					//claim ApeCoin
					it("claims apecoin", async () => {
						await stakingContract.claimSelfApeCoin();
					});
					//claim BAYC
					it("claims BAYC", async () => {
						let i = 0,
							arr = [];
						while (i < nftNumbers) {
							arr.push(i);
							i++;
						}
						await stakingContract.claimSelfBAYC(arr);
					});
					//claim MAYC
					it("claims MAYC", async () => {
						let i = 0,
							arr = [];
						while (i < nftNumbers) {
							arr.push(i);
							i++;
						}
						await stakingContract.claimSelfMAYC(arr);
					});
					//claim BAKC
					it("claims BAKC", async () => {
						let i = 0,
							baycArr = [],
							maycArr = [];
						while (i < nftPairNumbers) {
							baycArr.push({ mainTokenId: nftNumbers + i, bakcTokenId: i });
							maycArr.push({
								mainTokenId: nftNumbers + i,
								bakcTokenId: nftPairNumbers + i,
							});
							i++;
						}
						await stakingContract.claimSelfBAKC(baycArr, maycArr);
					});
					//withdraw ApeCoin
					it("withdraws apecoin", async () => {
						await stakingContract.withdrawSelfApeCoin(toWei(tokenAmount));
					});
					//withdraw BAYC
					it("withdraws BAYC", async () => {
						let i = 0,
							arr = [];
						while (i < nftNumbers) {
							arr.push({
								tokenId: i,
								amount: toWei(vars.amountApecoinToDepositWithNFTs),
							});
							i++;
						}
						await stakingContract.withdrawSelfBAYC(arr);
					});
					//withdraw MAYC
					it("withdraws MAYC", async () => {
						let i = 0,
							arr = [];
						while (i < nftNumbers) {
							arr.push({
								tokenId: i,
								amount: toWei(vars.amountApecoinToDepositWithNFTs),
							});
							i++;
						}
						await stakingContract.withdrawSelfMAYC(arr);
					});
					//withdraw BAKC
					it("withdraws BAKC", async () => {
						let i = 0,
							baycArr = [],
							maycArr = [];
						while (i < nftPairNumbers) {
							baycArr.push({
								mainTokenId: nftNumbers + i,
								bakcTokenId: i,
								amount: toWei(tokenAmountWithNft),
								isUncommit: true,
							});
							maycArr.push({
								mainTokenId: nftNumbers + i,
								bakcTokenId: nftPairNumbers + i,
								amount: toWei(tokenAmountWithNft),
								isUncommit: true,
							});
							i++;
						}
						await stakingContract.withdrawBAKC(baycArr, maycArr);
					});
				}
			}
			operations();
		});
	});
}
