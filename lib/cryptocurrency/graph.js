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
const fs = require('fs');
const readline = require('readline');
const csv = require('csv-parse/sync');
const { v1: uuidv1 } = require('uuid');
const { binary_to_base58 } = require('base58-js');
const reverseReadLine = require('reverse-line-reader');

class Graph {
    /**
     * Initializes graph with data from an existing graph
     *
     * @public
     * @param {Object} graph The existing graph to start.
     */
    constructor(graph, override) {
        this.graph = graph;
        this.target = override || settings.nodeType;
        this.labels = [
            'txId_str',
            'from_str',
            'to_str',
            'amount_num',
            'parent_str',
            'fee_num',
            'timestamp_str',
            'hash_str',
            'parentHash_str',
            'signature_str',
            'data_data'
        ];
        if(!fs.existsSync(`db/transactions-${ this.target }.db`)) {
            fs.appendFileSync(`db/transactions-${ this.target }.db`, JSON.stringify(this.labels).replace(/(\]|\[)/g, '') + '\n');
            Object.values(graph).forEach(tx => {
                let data = tx.data || {};
                fs.appendFileSync(
                    `db/transactions-${ this.target }.db`,
                    JSON.stringify([
                        tx.txId,
                        tx.from,
                        tx.to,
                        tx.amount,
                        tx.parent,
                        tx.fee,
                        tx.timestamp,
                        tx.hash,
                        tx.parentHash,
                        tx.signature,
                        Buffer.from(JSON.stringify(data)).toString('base64'),
                    ]).replace(/null/g, '""').replace(/(\]|\[)/g, '') + '\n'
                );
            });
        }
        this.batches = _.chunk(Object.values(this.graph), 1000);
    }

    /**
     * Scans the entire graph table line by line
     *
     * @public
     * @param {string|number} val The value to look for.
     * @param {Array|string} field The field or fields to search.
     * @param {string|number} scope How many results to search: all (default), first.
     * @param {timeout} timeout Time in seconds before timing out, 600 default
     * @returns {Object|Array} Returns object or array of objects matching search
     */
    tableScan(val, field, scope = 'all', timeout = 600) {
        return new Promise((resolve, reject) => {
            let t = setTimeout(() => {
                reject('Table scan timed out');
            }, timeout * 1000);
    
            const stream = readline.createInterface({
                input: fs.createReadStream(`db/transactions-${ this.target }.db`),
                crlfDelay: Infinity
            });
            let rowNum = 0;
            let result = [];
            let labels = [];
            const compare = (field, val, obj) => {
                let operator = '$eq';
                let path;
                if(_.isObject(val)) {
                    operator = val.operator;
                    path = val.path;
                    val = val.value;
                }
                let ret = false;
                switch(operator) {
                    case '$gte':
                        ret = field >= val;
                        break;
                    case '$gt':
                        ret = field > val;
                        break;
                    case '$lte':
                        ret = field <= val;
                        break;
                    case '$lt':
                        ret = field < val;
                        break;
                    case '$path':
                        field = _.get(obj, path);
                        ret = field === val;
                        break;
                    default:
                        ret = field === val;
                }
                return ret;
            }
            stream.on('line', line => {
                if(rowNum === 0) {
                    labels = csv.parse(line.toString())[0];
                } else {
                    let data = csv.parse(line.toString());
                    let obj = {};
                    for(let i=0; i<data[0].length; i++) {
                        if(labels[i].match(/_num/g)) {
                            obj[labels[i].replace(/_(num|str|data)$/gi, '')] = parseFloat(data[0][i]);
                        } else if(labels[i].match(/_data/g)) {
                            obj[labels[i].replace(/_(num|str|data)$/gi, '')] = JSON.parse(Buffer.from(data[0][i], 'base64').toString('utf-8'));
                        } else {
                            obj[labels[i].replace(/_(num|str|data)$/gi, '')] = data[0][i];
                        }
                    }

                    if(_.isArray(field)) {
                        field.forEach(currField => {
                            if(compare(obj[currField], val, obj)) {
                                result.push(obj);
                            }
                        });
                    } else if(_.isString(field)) {
                        if(compare(obj[field], val, obj)) {
                            result.push(obj);
                        }
                    }
                    
                    if(scope === 'first') {
                        if(result.length) {
                            stream.close();
                            resolve(result[0]);
                        }
                    } else if(_.isNumber(scope)) {
                        if(result.length === scope) {
                            stream.close();
                            resolve(result);
                        }
                    }
                }
                rowNum++;
            });
    
            stream.on('close', () => {
                clearTimeout(t);
                if(scope === 'first') {
                    if(result.length) {
                        resolve(result[0]);
                    }
                }
                resolve(result);
            });
        });
    }

    /**
     * Gets a vertex by txId.
     *
     * @public
     * @param {string} txId The txId of the vertex.
     * @returns {Object} Returns the matchec vertex.
     */
    async getVertex(txId) {
        let vertex = await this.tableScan(txId, 'txId', 'first');
        return vertex;
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
        let parentVertex = await this.getVertex(parent);
        if(!parentVertex) {
            throw new Error('Invalid parent vertex');
        }
        this.verifyChain(parentVertex.txId);
        this.verifyTransaction(transaction);
        let balance = await this.getWalletBalance(transaction.from);
        if(balance < transaction.amount) {
            throw new Error('Insufficient funds');
        }
        const txId = binary_to_base58(Buffer.from(uuidv1(), 'utf-8'));
        const vertex = {txId, parent, ...transaction, timestamp: new Date().toISOString()};
        vertex.parentHash = parentVertex.hash;
        vertex.hash = this.computeHash(vertex);
        let data = vertex.data || {};
        fs.appendFileSync(
            `db/transactions-${ this.target }.db`,
            JSON.stringify([
                vertex.txId,
                vertex.from,
                vertex.to,
                vertex.amount,
                vertex.parent,
                vertex.fee,
                vertex.timestamp,
                vertex.hash,
                vertex.parentHash,
                vertex.signature,
                Buffer.from(JSON.stringify(data)).toString('base64'),
            ]).replace(/null/g, '""').replace(/(\]|\[)/g, '') + '\n'
        );
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
        return this.tableScan(address, ['to','from'])
            .then(rows => {
                let amounts = rows.map(row => {
                    if(_.isNaN(row.fee)) {
                        row.fee = 0;
                    }
                    if(!_.isNumber(row.amount)) {
                        row.amount = 0;
                    }
                    if(row.from === address) {
                        return -1 * row.amount - row.fee;
                    } else if(row.to === address) {
                        return row.amount;
                    }
                    return 0;
                });
                if(!amounts.length) {
                    return 0;
                }
                let balance = amounts.reduce(
                    (previousValue, currentValue) => previousValue + currentValue,
                    0
                );
                return balance;
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
            let child;
            reverseReadLine.eachLine(`db/transactions-${ this.target }.db`, (line) => {
                if(line.toString().match(/^".*"$/gi)) {
                    let data = csv.parse(line.toString());
                    let obj = {};
                    for(let i=0; i<data[0].length; i++) {
                        if(this.labels[i].match(/_num/g)) {
                            obj[this.labels[i].replace(/_(num|str)$/gi, '')] = parseFloat(data[0][i]);
                        } else {
                            obj[this.labels[i].replace(/_(num|str)$/gi, '')] = data[0][i];
                        }
                    }
                    if(obj.txId === txId) {
                        if(obj.hash !== this.computeHash(obj)) {
                            reject(new Error('Invalid transaction hash ' + txId));
                        }
                        if(child && obj.parent !== 'genesis' && this.computeHash(obj) !== child.parentHash) {
                            reject(new Error('Transaction hash mismatch'));
                        }
                        txId = obj.parent;
                        child = obj;
                    } else if(obj.txId === 'genesis') {
                        resolve(true);
                    }
                }
            });
        });  
    }

    /**
     * Iterates through all transactions and finds an address matching an alias
     *
     * @public
     * @param {string} alias The alias to search for.
     * @returns {string|null} Returns wallet address found or null.
     */
    async getAddressForAlias(alias) {
        let vertex = await this.tableScan({operator: '$path', value: alias, path: 'data.alias'}, 'data', 'first');
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
    async getPGPKeyForAddress(address) {
        let results = await this.tableScan(address, 'from');
        let vertex = _.findLast(results, vertex => {
            return vertex.from === address && vertex.data && vertex.data.pgpPublicKey;
        });
        if(!vertex || !vertex.data || !vertex.data.pgpPublicKey) {
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
     * @param {number} limit Number of transactions to return.
     * @returns {Object} Returns latest transactions after timestamp.
     */
    async getTransactionsAfter(timestamp, limit = 50) {
        let children = await this.tableScan({operator: '$gte', value: timestamp}, 'timestamp', limit);
        return children;
    }

    /**
     * Gets transaction tree
     *
     * @public
     * @param {string} parentTxId The parent transaction to search for.
     * @param {integer} limit Number of transactions to return
     * @returns {Object} Returns child transactions.
     */
    async getTransactionTree(parentTxId, limit = 50) {
        const parentVertex = await this.getVertex(parentTxId);
        if(!parentVertex) {
            throw new Error('Invalid parent transaction ID');
        }
        let children = await this.tableScan(parentTxId, 'parent', limit);
        return _.keyBy(children, 'txId');
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

module.exports.instance = (graph, override) => {
    return new Graph(graph, override);
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