/*jshint esversion: 8 */

// Load program variables
require('dotenv').config();

// Load dependencies
const Web3 = require("web3");
const YAML = require("yaml");
const fs = require("fs");

// Read and parse the manifest file
console.info("Parse manifest file.");

let manifest = fs.readFileSync('./manifest.yaml', 'utf8');
manifest = YAML.parse(manifest);

const contracts = manifest.contracts;

// Read and parse pending transactions
let pendingTxs = fs.readFileSync('./pendingTxs.json');
pendingTxs = JSON.parse(pendingTxs);
pendingTxs = new Map(Object.entries(pendingTxs));

// file header
let d = "blockHash,blockNumber,from,gas,gasPrice,hash,input,nonce,r,s,to,transactionIndex,v,value,walletIndex,lifecycle,timestamp\n";

for (const [k1,v1] of pendingTxs) {
    for (const contract of contracts) {
        if (contract === v1.to) {
            apply(v1, d);
        }
    }
}

fs.writeFileSync('./pendingTxs.csv', d);

/**
 * Arbitrary function that takes any arguments
 * 
 * @param  {} ...args
 * @void
 */
function apply(...args) {
    v1 = args[0]; // transaction data
    d = args[1];  // appender

    const blockHash = v1.blockHash;
    const blockNumber = v1.blockNumber;
    const from = v1.from;
    const gas = v1.gas;
    const gasPrice = v1.gasPrice;
    const hash = v1.hash;
    const input = v1.input;
    const nonce = v1.nonce;
    const r = v1.r;
    const s = v1.s;
    const to = v1.to;
    const transactionIndex = v1.transactionIndex;
    const v = v1.v;
    const value = v1.value;
    const walletIndex = v1.walletIndex;
    const timestamp = v1.timestamp;

    d += blockHash;
    d += "," + blockNumber;
    d += "," + from;
    d += "," + gas;
    d += "," + gasPrice;
    d += "," + hash;
    d += "," + input;
    d += "," + nonce;
    d += "," + r;
    d += "," + s;
    d += "," + to;
    d += "," + transactionIndex;
    d += "," + v;
    d += "," + value;
    d += "," + walletIndex;
    d += "," + "start";
    d += "," + timestamp;
    d += "\n";
}
