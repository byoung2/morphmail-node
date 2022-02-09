
const { Transaction } = require('bitcoinjs-lib');
const SHA256 = require('crypto-js/sha256');
const crypto = require('crypto');
const bs58 = require('bs58');
const _ = require('lodash');
const wallet = require('./wallet');

class Graph {
    constructor(graph) {
        this.graph = graph;
    }

    addVertex(parent, transaction) {
        if(!this.graph[parent]) {
            throw 'Invalid parent vertex';
        }
        this.verifyChain(this.graph[parent].txId);
        this.verifyTransaction(transaction);
        const balance = this.getWalletBalance(transaction.from);
        if(balance < transaction.amount) {
            throw 'Insufficient funds';
        }
        const txId = bs58.encode(Buffer.from(crypto.randomBytes(32).toString('hex'), 'hex'));
        const vertex = {txId, parent, ...transaction, timestamp: new Date().toISOString()};
        vertex.parentHash = this.graph[parent].hash;
        vertex.hash = this.computeHash(vertex);
        this.graph[txId] = vertex;
        return vertex;
    }

    computeHash(vertex) {
        return bs58.encode(Buffer.from(SHA256(JSON.stringify(_.omit(vertex, 'hash'))).toString(), 'hex'));
    }

    getWalletBalance(address) {
        const reducer = (previousValue, currentValue) => {
            let amount = 0;
            if(currentValue.to === address) {
                amount = currentValue.amount;
            } else if(currentValue.from === address) {
                amount = -1 * currentValue.amount;
            }
            return previousValue + amount;
        }
        return Object.values(this.graph).reduce(reducer, 0);
    }

    verifyTransaction(transaction) {
        if(transaction.txId === 'genesis') {
            return;
        }
        const verify = 
            wallet.verifyMessage(
                JSON.stringify(
                    _.pick(transaction, ['to', 'from', 'amount'])
                ),
                transaction.from, 
                transaction.signature
            );
        if(!verify) {
            throw 'Invalid signature';
        }
    }

    verifyChain(txId) {
        while(txId !== 'genesis') {
            if(this.graph[txId].hash !== this.computeHash(this.graph[txId])) {
                throw new Error('Invalid transaction hash ' + txId );
            }
            let parent = this.graph[txId].parent;
            if(parent !== 'genesis' && this.computeHash(this.graph[parent]) !== this.graph[txId].parentHash) {
                throw 'Transaction hash mismatch';
            }
            txId = this.graph[txId].parent;
        }
        return true;
    }
}

module.exports.instance = (graph) => {
    return new Graph(graph);
};
module.exports.model = Graph;