import * as dotenv from "dotenv";
import "hardhat-gas-reporter";

dotenv.config();

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const {
	ALCHEMY_KEY,
	ETHERSCAN_API_KEY,
	PRIVATE_KEY_TESTNET,
	GAS_PRICE,
	COINMARKETCAP_KEY,
} = process.env;

const accountsTestnet = PRIVATE_KEY_TESTNET ? [PRIVATE_KEY_TESTNET] : "remote";

const gasPrice = GAS_PRICE ? Number(GAS_PRICE) : "auto";

const coinmarketcap = COINMARKETCAP_KEY;

module.exports = {
	gasReporter: {
		// coinmarketcap: coinmarketcap,
		// gasPrice: 20,
		// currency: "USD",
		token: "ETH",
		enabled: true,
		outputFile: "./gasReporterOutput.txt",
		noColors: true,
		rst: true,
		rstTitle: true,
		excludeContracts: ["SimpleERC20", "SimpleERC721", "ERC20", "ERC721"],
	},
	solidity: {
		compilers: [
			{
				version: "0.8.10",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		],
	},
	networks: {
		hardhat: {
			gasPrice: gasPrice,
		},
		localhost: {
			url: "http://127.0.0.1:8545",
		},
		goerli: {
			url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_KEY}`,
			accounts: accountsTestnet,
		},
	},
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: ETHERSCAN_API_KEY,
	},
	mocha: {
		timeout: 50000,
	},
};
