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

    const options = {
        // Useful if requests result are large
        clientConfig: {
            maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
            maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
        },
    };

    // Initialize web3 instance to connect into Ethereum mainnet.
    let web3 = new Web3(
        // Connect to local Ethereum node via WebSocket channel
        new Web3.providers.WebsocketProvider(`ws://127.0.0.1:8546`, options)
    );

    web3.extend({ // Extend module to retreive pending transactions from txpool via JSON-RPC API
        property: 'txpool',
        methods: [{
            name: 'content',
            call: 'txpool_content'
        },{
            name: 'inspect',
            call: 'txpool_inspect'
        },{
            name: 'status',
            call: 'txpool_status'
        }]
    });

    let pendingTxs = await web3.txpool.content();
    pendingTxs = pendingTxs.pending; // address level
    pendingTxs = new Map(Object.entries(pendingTxs));
    let p = new Map();

    // iterates over pending transaction entries
    for (let [k1, v1] of pendingTxs.entries()) {
        if (k1 !== undefined) {
            // const origKey = k1;
            k1 = k1.toLowerCase(); // address of user
            v1 = new Map(Object.entries(v1)); // list of transactions submitted
            for (let [k2, v2] of v1) {
                if (v2 !== null && v2.hash !== null) {
                    p.set(v2.hash, v2);
                    p.get(v2.hash).walletIndex = k2; 
                    p.get(v2.hash).timestamp = Date.now(); // timestamp the pending transaction
                }
            }
        }
    } pendingTxs = p;

    // Store pending transactions locally (or within HDFS)
    pendingTxs = Object.fromEntries(pendingTxs);
    pendingTxs = JSON.stringify(pendingTxs);
    fs.writeFileSync('./pendingTxs.json', pendingTxs);

    // Listen to txpool ...
    setInterval(async () => {
        pending = fs.readFileSync('./pendingTxs.json');
        pending = new Map(Object.entries(JSON.parse(pending)));

        let incomingPendingTxs = await web3.txpool.content();
        incomingPendingTxs = incomingPendingTxs.pending;
        incomingPendingTxs = new Map(Object.entries(incomingPendingTxs));
        let p = new Map();

        for (let [k1, v1] of incomingPendingTxs.entries()) {
            if (k1 !== undefined) {
                // const origKey = k1;
                k1 = k1.toLowerCase(); // address of user
                v1 = new Map(Object.entries(v1)); // list of transactions submitted
                for (let [k2, v2] of v1) {
                    if (v2 !== null && v2.hash !== null) {
                        p.set(v2.hash, v2);
                        p.get(v2.hash).walletIndex = k2; 
                        p.get(v2.hash).timestamp = Date.now(); // timestamp the incoming pending transaction
                        if (!pending.has(v2.hash)) {
                            console.log("New pending transaction: " + v2.hash);
                            pending.set(v2.hash, p.get(v2.hash)); // append to the pending transactions set
                        }
                    }
                }
            }
        }

        // Store pending transactions locally (or within HDFS)
        pending = Object.fromEntries(pending);
        pending = JSON.stringify(pending);
        fs.writeFileSync('./pendingTxs.json', pending);
    }, 1000); // update every second
}
