# Ape Staking Gas Improvement Proposal

This repository contains the efficient implemented version of Ape Staking Contract, there were improvements in terms of variables packing (while respecting possible values according to the requirements), assigning variables before a loop (since it would assign a new memory slot on each iteration), using access modifiers as needed, calling Apecoin transfer and transferFrom once, using storage instead of memory to read from storage when suitable, using revert errors instead of require, usage of unchecked when overflow is impossible.

## Dependencies
Install `Node.js v16.2.0`.

Run `npm install` to install dependencies.

## Demonstration
a set of test cases have been conducted on all functions in question, showcasing gas costs optimization difference between original staking contract and optimized version.

**optimization test case:**

where `numbersOfIterations` is 1000, to average out the gas costs.

![alt text](https://github.com/codeislight1/optimized-apecoin-staking/blob/master/tables/summary1000.png)

## Setup
using local development is sufficient

to run unit tests:

navigate to `test\test.ts`

you may edit the testing variables, or leave them in the default state

then run `npm run test`

it would display at the end gas profiling table