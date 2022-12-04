import fs from "fs";
let optimizedContractName = "OptimizedApeCoinStaking";
let unoptimizedContractName = "ApeCoinStaking";
// run the script after generating gasReporterOutput.txt
async function main() {
	let GWEI = 71.2 * 1e9; // average gas price in 3 years up to Dec 1st 2022, credit : etherscan
	let ETH_PRICE = 1658; // average ether price in 3 years up to Dec 1st 2022, credit : etherscan
	let optimized: Map<string, number> = new Map();
	let unoptimized: Map<string, number> = new Map();
	fs.readFile(
		"./gasReporterOutput.txt",
		{ encoding: "utf-8" },
		async (err, res) => {
			if (err) console.log("error thrown:", err);
			let lines = res.split("\n").slice(5);
			lines.forEach((line) => {
				let elements = line.split(" · ");
				let _case = 0;
				if (
					line.includes(optimizedContractName) ||
					line.includes(unoptimizedContractName)
				) {
					if (line.includes(optimizedContractName)) _case = 1;
					else if (line.includes(unoptimizedContractName)) _case = 2;
					elements.forEach(() => {
						if (_case === 1) {
							if (
								elements.length == 6 &&
								(line.includes(optimizedContractName) ||
									line.includes(unoptimizedContractName))
							)
								optimized.set("deployment", Number(elements[3]));
							if (elements.length == 7)
								optimized.set(elements[1].trim(), Number(elements[4]));
						} else if (_case === 2) {
							if (
								elements.length == 6 &&
								(line.includes(optimizedContractName) ||
									line.includes(unoptimizedContractName))
							)
								unoptimized.set("deployment", Number(elements[3]));
							if (elements.length == 7)
								unoptimized.set(elements[1].trim(), Number(elements[4]));
						}
					});
				}
				_case = 0;
			});
			const roundNumber = (value: number, decimalPoint: number) =>
				Math.round(value * 10 ** decimalPoint) / 10 ** decimalPoint;
			type State = {
				"unoptimized (gas)": number;
				"unoptimized cost $": number;
				"optimized (gas)": number;
				"optimized cost $": number;
				"reduction %": number;
				"saved $": number;
			};
			type FunState = {
				[key: string]: State;
			};
			let obj: FunState = {};
			const cancelledOut = [
				"addTimeRange",
				"removeLastTimeRange",
				"deployment",
			]; // functions that won't matter to end-user
			for (let [key, value] of unoptimized) {
				let optimizedGas: number = Number(optimized.get(key));
				let unoptimizedGas = value;
				if (cancelledOut.includes(key)) continue;
				obj[key] = {
					"unoptimized (gas)": unoptimizedGas,
					"unoptimized cost $": roundNumber(
						(unoptimizedGas * GWEI * ETH_PRICE) / 1e18,
						3
					),
					"optimized (gas)": optimizedGas,
					"optimized cost $": roundNumber(
						(optimizedGas * GWEI * ETH_PRICE) / 1e18,
						3
					),
					"reduction %": roundNumber(
						((unoptimizedGas - optimizedGas) * 100) / unoptimizedGas,
						3
					),
					"saved $": roundNumber(
						((unoptimizedGas - optimizedGas) * GWEI * ETH_PRICE) / 1e18,
						3
					),
				};
			}
			console.table(obj);
		}
	);
}

main();
