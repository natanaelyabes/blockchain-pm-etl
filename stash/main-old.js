/*jshint esversion: 8 */

// Load program variables.
require('dotenv').config();

// Load dependencies.
const Web3 = require("web3");
const YAML = require("yaml");
const fs = require("fs");

// Clear environment.
try {
    fs.unlinkSync('./pendingTxs.json');
} catch (e) {
    if (e) console.error("File specifed was not found, skipping ...");
    // continue ...
}

// Read and parse the manifest file.
console.info("Parse manifest file.");

let manifest = fs.readFileSync('./manifest.yaml', 'utf8');
manifest = YAML.parse(manifest);

// Execute program.
main(manifest);

/**
 * The main entry where the program runs from.
 * 
 * @author Natanael Yabes Wirawan <yabes.wirawan@pusan.ac.kr>
 * @param  {} manifest
 * @void
 */
async function main (manifest) {

    console.info("Running program ...");

    // List of contracts defined in the manifest
    const contracts = manifest.contracts;

    // Initialize web3 instance to connect into Ethereum mainnet.
    let web3 = new Web3(
        // Connect to local Ethereum node via WebSocket channel
        new Web3.providers.WebsocketProvider(`ws://127.0.0.1:8546`, options)
    );

    // Subscribe to pending transaction event.
    const pendingTx = web3.eth.subscribe('pendingTransactions');
    
    const pendingTxs = []; // Array to store pending transactions.
    
    console.log("Listen to pending transactions ...");

    pendingTx.on('data', async (hash) => { // Listen to data events
        let detail = await web3.eth.getTransaction(hash); // Get transaction detail.
        let isEqualToContract;

        if (manifest.debug) { // For debugging purposes.
            console.log(detail);
        }

        if (detail !== null) {                      // Begin to read and filter transactions.
            detail.timestamp = Date.now(); // Retreive the current timestamp for pending transaction in UNIX format.
            contracts.map(async contract => { 
                contract = contract.toLowerCase();
                detail.to = detail.to.toLowerCase();
                if (contract === detail.to) { // Does the destination contract equals to one that we have defined in the manifest? 
                    console.log("Save transaction locally, hash: " + detail.hash);
                    pendingTxs.push(JSON.stringify(detail));
                    fs.writeFileSync("./pendingTxs.json", pendingTxs); // Store the transaction locally (or to HDFS).
                }
            });
        }
    });
}
