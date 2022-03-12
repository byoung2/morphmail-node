
const { Transaction } = require('bitcoinjs-lib');
const SHA256 = require('crypto-js/sha256');
const crypto = require('crypto');
const bs58 = require('bs58');
const _ = require('lodash');
const wallet = require('./wallet');

class Graph {
    /**
     * Initializes graph with data from an existing graph
     *
     * @public
     * @param {Object} graph The existing graph to start.
     */
    constructor(graph) {
        this.graph = graph;
    }

    /**
     * Adding a transaction vertex (unverified) requires verifying the parent
     * transaction. This means verifying the hashes of all parents back to the genesis
     * vertex, verifying the current transaction was signed by the wallet owner, verifying
     * sufficient funds, appending the parent hash, and caluclating the hash of the current
     * transaction.
     *
     * @public
     * @param {string} parent The txId of the parent transaction in the tree.
     * @param {Object} transaction The new transaction to be added as child of parent.
     * @returns {Object} Returns newly created vertex.
     */
    addVertex(parent, transaction) {
        if(!this.graph[parent]) {
            throw new Error('Invalid parent vertex');
        }
        this.verifyChain(this.graph[parent].txId);
        this.verifyTransaction(transaction);
        const balance = this.getWalletBalance(transaction.from);
        if(balance < transaction.amount) {
            throw new Error('Insufficient funds');
        }
        const txId = bs58.encode(Buffer.from(crypto.randomBytes(32).toString('hex'), 'hex'));
        const vertex = {txId, parent, ...transaction, timestamp: new Date().toISOString()};
        vertex.parentHash = this.graph[parent].hash;
        vertex.hash = this.computeHash(vertex);
        this.graph[txId] = vertex;
        return vertex;
    }

    /**
     * The hash of the vertex takes the JSON string representation of the vertex (the existing hash removed)
     * and calculates the SHA256 hash. The hash is then converted to base58 format
     *
     * @public
     * @param {Object} vertex The vertex to compute the hash of.
     * @returns {string} Returns the base58 hash of the vertex.
     */
    computeHash(vertex) {
        return bs58.encode(Buffer.from(SHA256(JSON.stringify(_.omit(vertex, 'hash'))).toString(), 'hex'));
    }

    /**
     * Iterates through all transactions and calculates wallet balance by adding transaction
     * amounts received and subtracting transaction amounts sent
     *
     * @public
     * @param {string} address The wallet address.
     * @returns {number} Returns the balance as a decimal number.
     */
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

    /**
     * Verifies that the transaction signature is valid using a minimal representation
     * of the transaction, the wallet, and signature string
     *
     * @public
     * @param {Object} transaction The transaction to verify.
     * @returns {boolean} true on success
     * @throws {Error} Throws error on invalid signature
     */
    verifyTransaction(transaction) {
        if(transaction.txId === 'genesis') {
            return true;
        }
        const verify = 
            wallet.verifyMessage(
                JSON.stringify(
                    _.pick(transaction, ['to', 'from', 'amount', 'data'])
                ),
                transaction.from, 
                transaction.signature
            );
        if(!verify) {
            throw new Error('Invalid signature');
        }
        return verify;
    }

    /**
     * Verifies that the chain of parents all the way to the genesis vertex is valid
     *
     * @public
     * @param {string} txId The transaction id to start from.
     * @returns {boolean} true on success
     * @throws {Error} Throws error on invalid hash anywhere along chain
     */
    verifyChain(txId) {
        while(txId !== 'genesis') {
            if(this.graph[txId].hash !== this.computeHash(this.graph[txId])) {
                console.log('testing', this.graph, this.graph[txId].hash, this.computeHash(this.graph[txId]))
                throw new Error('Invalid transaction hash ' + txId );
            }
            let parent = this.graph[txId].parent;
            if(parent !== 'genesis' && this.computeHash(this.graph[parent]) !== this.graph[txId].parentHash) {
                throw new Error('Transaction hash mismatch');
            }
            txId = this.graph[txId].parent;
        }
        return true;
    }

    /**
     * Iterates through all transactions and finds an address matching an alias
     *
     * @public
     * @param {string} alias The alias to search for.
     * @returns {string|null} Returns wallet address found or null.
     */
     getAddressForAlias(alias) {
        let vertex = _.find(this.graph, vertex => {
            return vertex.data && vertex.data.alias === alias;
        });
        if(!vertex) {
            return null;
        }
        return vertex.from;
    }

    /**
     * Gets latest vertex ID
     *
     * @public
     * @returns {string} Returns latest transaction ID.
     */
     getLatestTxID() {
        return _.last(Object.values(this.graph)).txId;
    }
}

module.exports.instance = (graph) => {
    return new Graph(graph);
};
module.exports.model = Graph;