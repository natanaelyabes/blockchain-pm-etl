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
const abi = {}; // to store the ABI

const options = {
    clientConfig: { // Useful if requests result are large
        maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
        maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
    },
};

// Initialize web3 instance to connect into Ethereum mainnet
let web3 = new Web3(
    // Connect to local Ethereum node via WebSocket channel
    new Web3.providers.WebsocketProvider(`ws://127.0.0.1:8546`, options)
);

// Get contract abi
for (const contract of contracts) {
    abi[contract] = fs.readFileSync(`./abi/${contract}`, { encoding: 'utf8' });
    abi[contract] = JSON.parse(abi[contract]);
}

// Read & parse pending event log data
let evs = fs.readFileSync('./data/eventLog.json');
evs = JSON.parse(evs);

// Load input data and abi decoder dependencies
const InputDataDecoder = require('ethereum-input-data-decoder');
const abiDecoder = require('abi-decoder');

// Afterwards, decode the input and log data
evs.map((tx) => {

    // Decode input data
    const contract = tx.to; 
    let input = tx.input; // input data
    const decoder = new InputDataDecoder(abi[contract]);
    input = decoder.decodeData(input); // decode the input data
    input.inputs = input.inputs.map(input => // decode BN format to string
        web3.utils.isBN(input) ? new web3.utils.BN(input).toString() : input); 
    tx.input = input;

    // Decode log data
    abiDecoder.addABI(abi[contract]); // Register ABI to the decoder
    let log; web3.eth.getTransactionReceipt(tx.hash, (e, receipt) => {
        log = abiDecoder.decodeLogs(receipt.logs); // decode logs in the tx receipt
        tx.log = log; // append decoded log to pending transaction data
        fs.writeFileSync('./data/eventLogDecoded.json', JSON.stringify(evs));
    });
});
