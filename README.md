# Ape Staking Gas Improvement Proposal

This repository contains the efficient implemented version of Ape Staking Contract, there were improvements in terms of variables packing (while respecting possible values according to the requirements), assigning variables before a loop (since it would assign a new memory slot on each iteration), using access modifiers as needed, calling Apecoin transfer and transferFrom once, using storage instead of memory to read from storage when suitable, using revert errors instead of require, usage of unchecked when overflow is impossible.

## Dependencies
Install `Node.js v16.2.0`.

Run `npm install` to install dependencies.

## Demonstration
2 test cases have been conducted to elaborate on gas costs optimization difference.

**first optimization test case:**
it used `numberOfNFTsToSingleDeposit: 1` and `numberOfNFTsToPairDeposit: 1` setup
and for `numbersOfIterations` is 1,

![alt text](https://github.com/codeislight1/optimized-apecoin-staking/blob/master/tables/summary1.png)

**second optimization test case:**
it used `numberOfNFTsToSingleDeposit: 2` and `numberOfNFTsToPairDeposit: 2` setup
and for `numbersOfIterations` is 1,

![alt text](https://github.com/codeislight1/optimized-apecoin-staking/blob/master/tables/summary2.png)

**second optimization test case:**
it used `numberOfNFTsToSingleDeposit: 5` and `numberOfNFTsToPairDeposit: 5` setup
and for `numbersOfIterations` is 1,

![alt text](https://github.com/codeislight1/optimized-apecoin-staking/blob/master/tables/summary5.png)

## Setup
using local development is sufficient

to run unit tests:

navigate to `test\test.ts`

you may edit the testing variables, or leave them in the default state

then run `npm run test`

it would display at the end gas profiling table

