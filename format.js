/*jshint esversion: 8 */

// Load program variables
require('dotenv').config();

const fs = require('fs'); // Load dependencies

// Read and parse decoded transactions
let decodedEvs = fs.readFileSync('./data/eventLogDecoded.json', { encoding: 'utf8' });
decodedEvs = JSON.parse(decodedEvs);

// Define block header
let d = "blockHash,blockNumber,from,gas,gasPrice,hash,nonce,to,value,lifecycle,timestamp,event_name";
let paramCol = []; decodedEvs.map((tx) => { // record event param columns
    const logs = tx.log; // transaction event log
    logs.map((log) => { // iterate over events
        const param = {}; // event params
        log.events.map((event) => { // for each event param
            paramCol.push(event.name); // records param column
        });
    }); // finish iterate over events
}); paramCol = [...new Set(paramCol)];

let prefix = ","; // seperate param col with delimiter
paramCol.forEach(col => d += prefix + "param_" + col);
d += "\n"; // insert new line to appender

decodedEvs.map((tx) => { // Convert decoded evs to csv
    
    // Event log information
    const blockHash = tx.blockHash; // null if it is a pending transaction
    const blockNumber = tx.blockNumber; // null if it is a pending transaction
    const from = tx.from; // the sender address (case id)
    const gas = tx.gas; // gas that senders able to provide (limit)
    const gasPrice = tx.gasPrice; // gas price that senders paid (WEI)
    const hash = tx.hash; // transaction document reference
    const nonce = tx.nonce; // arbitrary number issued to prevent double-spending attack
    const to = tx.to; // contract address (resource)
    const value = tx.value; // value of transaction (ETH)
    const lifecycle = tx.lifecycle; // event lifecycle (start/complete)
    const timestamp = tx.timestamp; // timestamp (start: pending, complete: confirmed)
    const data = blockHash
         + "," + blockNumber
         + "," + from
         + "," + gas
         + "," + gasPrice
         + "," + hash
         + "," + nonce
         + "," + to
         + "," + value
         + "," + lifecycle
         + "," + timestamp;

    // Extract event log data
    const logs = tx.log; // decoded event log (event name)
    logs.map((log) => { // iterate over events
        d += data; // append data for each event log
        const name = log ? log.name : ""; d += "," + name;
        const param = {}; const cols = {};
        for (const event of log.events) {
            param[event.name] = { type: event.type, value: event.value };
            apply(event.name, paramCol, param, cols);
        } d += "," + Object.values(cols).join(','); d += "\n"; // new line
    });
});

fs.writeFileSync('./data/eventLog.csv', d);

/**
 * Arbitrary function that takes any arguments
 * 
 * @param  {} ...args
 * @void
 */
function apply(...args) {
    
    let paramName = args[0];
    let paramCol = args[1];
    let param = args[2];
    let cols = args[3];

    // Append data
    for (const col of paramCol) {
        cols[col] = paramName === col ? param[paramName].value : ""; 
    }
}
