const SHA256 = require('crypto-js/sha256');
const crypto = require('crypto');
const bs58 = require('bs58');
const _ = require('lodash');
const wallet = require('./wallet');
const DB = require('./../db');
const graphDb = DB.instance('db/graph', 'json');
const db = DB.instance('db/config', 'json');
const settings = db.get('/settings');
const peer = require('./../peer');
const { resolve } = require('path');
const { reject } = require('lodash');

class Graph {
    /**
     * Initializes graph with data from an existing graph
     *
     * @public
     * @param {Object} graph The existing graph to start.
     */
    constructor(graph) {
        this.graph = graph;
        this.batches = _.chunk(Object.values(this.graph), 1000);
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
    async addVertex(parent, transaction) {
        if(!this.graph[parent]) {
            throw new Error('Invalid parent vertex');
        }
        this.verifyChain(this.graph[parent].txId);
        this.verifyTransaction(transaction);
        const balance = await this.getWalletBalance(transaction.from);
        if(balance < transaction.amount) {
            throw new Error('Insufficient funds');
        }
        const txId = bs58.encode(Buffer.from(crypto.randomBytes(32).toString('hex'), 'hex'));
        const vertex = {txId, parent, ...transaction, timestamp: new Date().toISOString()};
        vertex.parentHash = this.graph[parent].hash;
        vertex.hash = this.computeHash(vertex);
        this.graph[txId] = vertex;
        graphDb.add(`/${ settings.nodeType }/${ txId }`, vertex);
        peer.broadcastToPeers({
            transaction: vertex,
        });
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
        return new Promise((resolve, reject) => {
            const reducer = (previousValue, currentValue) => {
                let amount = 0;
                if(currentValue.to === address) {
                    amount = currentValue.amount;
                } else if(currentValue.from === address) {
                    amount = -1 * currentValue.amount;
                }
                return previousValue + amount;
            }
            resolve(Object.values(this.graph).reduce(reducer, 0));
        });
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
                    _.pick(transaction, ['to', 'from', 'amount', 'fee', 'data'])
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
     * @param {string} txId The transaction id to start from.s
     * @returns {boolean} true on success
     * @throws {Error} Throws error on invalid hash anywhere along chain
     */
    verifyChain(txId) {
        return new Promise((resolve, reject) => {
            while(txId !== 'genesis') {
                if(this.graph[txId].hash !== this.computeHash(this.graph[txId])) {
                    reject(new Error('Invalid transaction hash ' + txId));
                }
                let parent = this.graph[txId].parent;
                if(parent !== 'genesis' && this.computeHash(this.graph[parent]) !== this.graph[txId].parentHash) {
                    reject(new Error('Transaction hash mismatch'));
                }
                txId = this.graph[txId].parent;
            }
            resolve(true);
        });
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
     * Iterates through all transactions and finds a PGP public key for address
     *
     * @public
     * @param {string} address The address to search for.
     * @returns {string|null} Returns PGP public key found or null.
     */
    getPGPKeyForAddress(address) {
        let vertex = _.findLast(this.graph, vertex => {
            return vertex.from === address && vertex.data && vertex.data.pgpPublicKey;
        });
        if(!vertex) {
            return null;
        }
        return vertex.data.pgpPublicKey;
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

    /**
     * Gets transactions after timestamp
     *
     * @public
     * @param {string} timestamp The timestamp to search for.
     * @returns {Object} Returns latest transactions after timestamp.
     */
    getTransactionsAfter(timestamp) {
        return _.filter(Object.values(this.graph), vertex => {
            return vertex.timestamp > timestamp;
        });
    }

    /**
     * Gets transaction tree
     *
     * @public
     * @param {string} parentTxId The parent transaction to search for.
     * @param {integer} limit number of transactions to return
     * @returns {Object} Returns child transactions.
     */
    getTransactionTree(parentTxId, limit = 50) {
        if(!this.graph[parentTxId]) {
            throw new Error('Invalid parent transaction ID');
        }
        const out = {}, parents = [parentTxId];
        let count = 1;
        out[parentTxId] = this.graph[parentTxId];

        _.each(Object.values(this.graph), vertex => {
            if(count >= limit) {
                return false;
            }
            if(parents.indexOf(vertex.parent)) {
                out[vertex.txId] = vertex;
                parents.push(vertex.txId);
                count++;
            }
        });
        return out;
    }

    /**
     * Gets transactions since bookmark
     *
     * @public
     * @param {number} bookmark The batch index to start from
     * @returns {Object} Returns latest transactions after bookmark.
     */
    getGraphInBatches(bookmark) {
        if(!this.batches[bookmark]) {
            throw new Error("Nonexistent batch");
        }
        return this.batches[bookmark];
    }

    /**
     * Returns the graph as a simple object
     *
     * @public
     * @returns {Object} Returns graph as a simple object.
     */
    toObject() {
        return this.graph;
    }
}

module.exports.instance = (graph) => {
    return new Graph(graph);
};
module.exports.model = Graph;

/**
* Gets genesis vertex
*
* @public
* @returns {Object} Returns genesis vertex.
*/
module.exports.getGenesis = function() {
   return {
       genesis: {
           txId: 'genesis',
           parent: null,
           to: '1HH9Pt39FD3NEcT59TKDdNHK2gGiqgCp7h',
           from: null,
           amount: 100000000,
           fee: 0,
           timestamp: '2022-02-07T03:49:01+00:00',
           hash: 'hash',
           data: {
               alias: 'morphmail'
           },
       }
   };
}