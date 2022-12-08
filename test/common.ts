import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, network } from "hardhat";

function secondsTilNextHour(now: Date): number {
	return 3600 - now.getSeconds() - now.getMinutes() * 60;
}
async function speedUp(time: number) {
	await network.provider.send("evm_increaseTime", [time]);
	await network.provider.send("evm_mine");
}
export type Variables = {
	amountNFTsToMint: number;
	numbersOfIterations: number;
	timeInBetween: number;
};
enum NFT {
	BAYC,
	MAYC,
	BAKC,
}
export const toWei = (amount: number) =>
	ethers.utils.parseEther(amount.toString());

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
		let TOTAL_QUARTERS_AMOUNTS: number[][];
		const CAP_PERPOSITION = [toWei(1), toWei(10094), toWei(2042), toWei(856)];
		const tokenAmount = 1;
		const tokenAmountWithNft = 1;
		const nftNumbers = 1;
		const nftPairNumbers = 1;
		const NINETY_ONE_DAYS_IN_SECONDS = 24 * 3600 * 91;
		const NINETY_TWO_DAYS_IN_SECONDS = 24 * 3600 * 92;
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
		before(async () => {
			tokenIdTracker = {
				bayc: 0,
				mayc: 0,
				bakc: 0,
			};
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
			await ape.mintOwner(addr1.address, toWei(11000));
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
			it("should prefund contract", async () => {
				let amount = toWei(175_000_000);
				await ape.transfer(stakingContract.address, amount);
				expect(await ape.balanceOf(stakingContract.address)).to.be.eq(amount);
			});
			it("mints NFTs", async () => {
				// minting NFTs
				let toBeMinted = vars.amountNFTsToMint;
				while (toBeMinted > 0) {
					let amount = toBeMinted > 10 ? 10 : toBeMinted;
					await bayc.mint(amount);
					await mayc.mint(amount);
					await bakc.mint(amount);
					toBeMinted -= amount;
				}
				// tokenId is the amountNFTsToMint
				await bayc.connect(addr1).mint(1);
				await mayc.connect(addr1).mint(1);
				await bakc.connect(addr1).mint(1);
			});
			it("setup time ranges", async () => {
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
			it("$APE approval", async () => {
				await ape.approve(stakingContract.address, ethers.constants.MaxUint256);
				await ape
					.connect(addr1)
					.approve(stakingContract.address, ethers.constants.MaxUint256);
			});
			// fucntion used to check users's balance change
			async function checkBalance(
				Fun: Function,
				checkIncrease: boolean,
				address: string = owner.address
			) {
				let _beforeBal = await ape.balanceOf(address);
				await Fun();
				let _afterBal = await ape.balanceOf(address);
				// check increase of user balance
				checkIncrease
					? expect(_afterBal).gt(_beforeBal)
					: expect(_beforeBal).gt(_afterBal);
			}
			function depositTests(isOwner: boolean) {
				//deposit apecoin
				it("self deposit apecoin", async () => {
					const signer = isOwner ? owner : addr1;
					tokenIdTracker = {
						bayc: 0,
						mayc: 0,
						bakc: 0,
					};
					await checkBalance(
						async () => {
							await stakingContract
								.connect(signer)
								.depositSelfApeCoin(toWei(tokenAmount));
						},
						false,
						signer.address
					);
				});
				//deposit BAYC
				it("deposit BAYC", async () => {
					const signer = isOwner ? owner : addr1;
					let nfts: Array<Object> = [];
					for (let i = 0; i < nftNumbers; i++) {
						let nft = {
							tokenId: isOwner
								? tokenIdDeposit(NFT.BAYC)
								: vars.amountNFTsToMint,
							amount: toWei(tokenAmountWithNft),
						};
						nfts.push(nft);
					}
					await checkBalance(
						async () => {
							await stakingContract.connect(signer).depositBAYC(nfts);
						},
						false,
						signer.address
					);
				});
				//deposit MAYC
				it("deposit MAYC", async () => {
					const signer = isOwner ? owner : addr1;
					let nfts: Array<Object> = [];
					for (let i = 0; i < nftNumbers; i++) {
						let nft = {
							tokenId: isOwner
								? tokenIdDeposit(NFT.MAYC)
								: vars.amountNFTsToMint,
							amount: toWei(tokenAmountWithNft),
						};
						nfts.push(nft);
					}
					await checkBalance(
						async () => {
							await stakingContract.connect(signer).depositMAYC(nfts);
						},
						false,
						signer.address
					);
				});
				//deposit BAKC
				it("deposit BAKC", async () => {
					const signer = isOwner ? owner : addr1;
					let BaycNfts: Array<Object> = [];
					// let MaycNfts = [];
					let nft;
					for (let i = 0; i < nftPairNumbers; i++) {
						nft = {
							mainTokenId: isOwner
								? tokenIdDeposit(NFT.BAYC)
								: vars.amountNFTsToMint,
							bakcTokenId: isOwner
								? tokenIdDeposit(NFT.BAKC)
								: vars.amountNFTsToMint,
							amount: toWei(tokenAmountWithNft),
						};
						BaycNfts.push(nft);
					}
					await checkBalance(
						async () => {
							await stakingContract.connect(signer).depositBAKC(BaycNfts, []);
						},
						false,
						signer.address
					);
				});
			}

			function operations() {
				// initial speed up to be within staking Q1 period
				it("speeds up time", async () => {
					await speedUp(vars.timeInBetween);
				});
				// Deposit tests by addr1 to have warm pool storage slots on each iteration's start
				depositTests(false);
				for (let i = 0; i < vars.numbersOfIterations; i++) {
					// Deposit tests by owner
					depositTests(true);
					it("speeds up time", async () => {
						console.log("i = ", i);
						await speedUp(vars.timeInBetween);
					});
					// Claim tests by owner
					//claim ApeCoin
					it("claims apecoin", async () => {
						await checkBalance(async () => {
							await stakingContract.claimSelfApeCoin();
						}, true);
					});
					//claim BAYC
					it("claims BAYC", async () => {
						let i = 0,
							arr: Array<number> = [];
						while (i < nftNumbers) {
							arr.push(i);
							i++;
						}
						await checkBalance(async () => {
							await stakingContract.claimSelfBAYC(arr);
						}, true);
					});
					//claim MAYC
					it("claims MAYC", async () => {
						let i = 0,
							arr: Array<number> = [];
						while (i < nftNumbers) {
							arr.push(i);
							i++;
						}
						await checkBalance(async () => {
							await stakingContract.claimSelfMAYC(arr);
						}, true);
					});
					//claim BAKC
					it("claims BAKC", async () => {
						let i = 0,
							baycArr: Array<Object> = [];
						// maycArr = [];
						while (i < nftPairNumbers) {
							baycArr.push({ mainTokenId: nftNumbers + i, bakcTokenId: i });
							i++;
						}
						await checkBalance(async () => {
							await stakingContract.claimSelfBAKC(baycArr, []);
						}, true);
					});
					it("speeds up time", async () => {
						await speedUp(vars.timeInBetween);
					});
					// Withdraw tests by owner
					//withdraw ApeCoin
					it("withdraws apecoin", async () => {
						await checkBalance(async () => {
							await stakingContract.withdrawSelfApeCoin(toWei(tokenAmount));
						}, true);
					});
					//withdraw BAYC
					it("withdraws BAYC", async () => {
						let i = 0,
							arr: Array<Object> = [];
						while (i < nftNumbers) {
							arr.push({
								tokenId: i,
								amount: toWei(tokenAmountWithNft),
							});
							i++;
						}
						await checkBalance(async () => {
							await stakingContract.withdrawSelfBAYC(arr);
						}, true);
					});
					//withdraw MAYC
					it("withdraws MAYC", async () => {
						let i = 0,
							arr: Array<Object> = [];
						while (i < nftNumbers) {
							arr.push({
								tokenId: i,
								amount: toWei(tokenAmountWithNft),
							});
							i++;
						}
						await checkBalance(async () => {
							await stakingContract.withdrawSelfMAYC(arr);
						}, true);
					});
					//withdraw BAKC
					it("withdraws BAKC", async () => {
						let i = 0,
							baycArr: Array<Object> = [];
						// maycArr = [];
						while (i < nftPairNumbers) {
							baycArr.push({
								mainTokenId: nftNumbers + i,
								bakcTokenId: i,
								amount: toWei(tokenAmountWithNft),
								isUncommit: true,
							});
							i++;
						}
						await checkBalance(async () => {
							await stakingContract.withdrawBAKC(baycArr, []);
						}, true);
					});
				}
			}
			operations();
		});
	});
}
