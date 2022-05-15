const StorageManager = require('./../storage');
const peer = require('./../peer');
const graph = require('./../cryptocurrency/graph');
const _ = require('lodash');
const wsServer = require('ws');
const DB = require('./../db');
const graphDb = DB.instance('db/graph', 'json');
const db = DB.instance('db/config', 'json');
const settings = db.get('/settings');
const { v4: uuidv4 } = require('uuid');

class RPC {
    /**
     * Initializes rpc with options object. At minimum, serverId is required
     *
     * @public
     * @param {Object} options options object, serverId required.
     */
    constructor(options) {
        this.serverId = options.serverId;
        this.ipAddress = options.ipAddress;
        if(options.graph) {
            this.graph = options.graph;
        } else {
            this.graph = graph.instance(graphDb.get(`/${ settings.nodeType }`));
        }
    }

    /**
     * Registers a peer by address. Peers can either be of type client, which 
     * can connect to a node but is not publicly addressable by IP or hostname, 
     * or node, which is reachable by IP or hostname
     *
     * @public
     * @param {object} data object containing address and type 
     * @returns {Promise} returns a resolved promise with a boolean value
     */
    registerPeer(data) {
        const {address, type, parents, ipAddress, socket} = data;
        if(parents.indexOf(this.ipAddress) === -1) {
            parents.push(this.serverId);
        }
        StorageManager.addPeer({
            address,
            type,
            parents,
            ipAddress,
            socket,
        });
        return Promise.resolve(true);
    }

    /**
     * Unregisters a peer by address. 
     *
     * @public
     * @param {string} address The MorphMail address of the peer.
     * @returns {Promise} returns a resolved promise with a boolean value
     */
    unRegisterPeer(data) {
        const {address} = data;
        StorageManager.removePeer(address);
        return Promise.resolve(true);
    }

    /**
     * Returns all peers of the current node
     *
     * @public
     * @returns {Object} object keyed on address
     */
    getPeers() {
        const peers = _(StorageManager.getPeers())
            .map(peer => _.pick(peer, ['address', 'type', 'parents', 'ipAddress']))
            .keyBy('address')
            .value();
        return Promise.resolve(peers);
    }

    /**
     * Returns peer IP addresses by client
     *
     * @public
     * @param {Object} data 
     * @returns {Object} object keyed on address
     */
    getPeersByClientAddress(data) {
        const peers = peer.getNodeIpAddresses(data.address, StorageManager.getPeers());
        return Promise.resolve(peers);
    }

    /**
     * Returns addresses by alias
     *
     * @public
     * @param {string} alias The alias to search for.
     * @returns {string|null} Returns wallet address found or null.
     */
    getAddressForAlias(alias) {
        const address = this.graph.getAddressForAlias(alias);
        return Promise.resolve(address);
    }

    /**
     * Gets all transactions 
     *
     * @public
     * @param {string} bookmark the bookmark to indicate which batch to fetch
     * @returns {Object} Returns all transactions.
     */
    getGraphInBatches(bookmark=0) {
        try {
        const transactions = this.graph.getGraphInBatches(bookmark);
        } catch(e) {
            return Promise.resolve([]);
        }
        
        return Promise.resolve(transactions);
    }

    /**
     * Gets transactions after timestamp
     *
     * @public
     * @param {string} timestamp The ISO-8601 timestamp to search for.
     * @returns {Object} Returns latest transactions after timestamp.
     */
    getTransactionsAfter(timestamp) {
        const transactions = this.graph.getTransactionsAfter(timestamp);
        return Promise.resolve(transactions);
    }

    /**
     * Gets transactions starting at parent
     *
     * @public
     * @param {string} timestamp The timestamp to search for.
     * @returns {Object} Returns latest transactions after timestamp.
     */
    getTransactionTree(parentTxId, limit = 50) {
        const tree = this.graph.getTransactionTree(parentTxId, limit);
        return Promise.resolve(tree);
    }

    /**
     * Creates a new transaction
     *
     * @public
     * @param {string} timestamp The timestamp to search for.
     * @returns {Object} Returns latest transactions after timestamp.
     */
    newTransaction(data) {
        const transaction =  _.omit(data, 'socket');
        const parent = this.graph.getLatestTxID();
        return this.graph.addVertex(parent, transaction);
    }

    /**
     * Returns PGP public key for alias/address
     *
     * @public
     * @param {string} search The alias or address to search for.
     * @returns {string|null} Returns PGP key found or null.
     */
    getPGPKey(search) {
        let address = search;
        if(search.match(/@/)) {
            address = this.graph.getAddressForAlias(search);
        }
        const key = this.graph.getPGPKeyForAddress(address);
        return Promise.resolve(key);
    }

    /**
     * Returns the server ID of the current node
     *
     * @public
     * @returns {string} string server ID
     */
    getServerId() {
        return Promise.resolve(this.serverId);
    }

    /**
     * Sends message to client by address
     *
     * @public
     * @param {Object} data 
     * @returns {Object} message meta
     */
    sendMessageToClientAddress(data) {
        const peerList = StorageManager.getPeers();
        const peers = peer.getNodeIpAddresses(data.address, peerList);
        if(peers.indexOf(this.ipAddress) !== -1) {
            peerList[data.address].socket.send(JSON.stringify({message: data.message}))
            return Promise.resolve({
                method: 'direct',
            });
        }
        peer.broadcastToPeers(data);
        return Promise.resolve({
            method: 'broadcast',
        });
    }

    /**
     * Forwards message to all peers
     *
     * @public
     * @param {Object} data 
     * @returns {string} message id
     */
    forwardMessageToPeers(data) {
        const peerList = StorageManager.getPeers();
        const peers = peer.getNodeIpAddresses(data.address, peerList);
        if(peers.indexOf(this.ipAddress) !== -1) {
            peerList[data.address].socket.send(JSON.stringify({message: data.message}))
            return Promise.resolve({
                method: 'direct',
            });
        }
        peer.broadcastToPeers(data);
        return Promise.resolve({
            method: 'broadcast',
        });
    }

    /**
     * Calls allowed methods
     *
     * @public
     * @param {string} method The method, as defined in the class.
     * @param {Array} params Array or params to pass to the method.=
     * @returns {Array} array of params to pass to the method
     * @throws {Error} Throws error on invalid method
     */
    call(method, params) {
        if(!this[method]) {
            throw new Error('Invalid method');
        }
        return this[method].apply(this, params);
    }
}

module.exports.instance = (options) => {
    return new RPC(options);
};
module.exports.model = RPC;