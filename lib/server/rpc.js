const StorageManager = require('./../storage');
const peer = require('./../peer');
const graph = require('./../cryptocurrency/graph');
const _ = require('lodash');
const wsServer = require('ws');
const DB = require('./../db');
const { add } = require('lodash');
const graphDb = DB.instance('db/graph', 'json');

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
            this.graph = graph.instance(graphDb.get('/main'));
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
     * Gets transactions after timestamp
     *
     * @public
     * @param {string} timestamp The timestamp to search for.
     * @returns {Object} Returns latest transactions after timestamp.
     */
    getTransactionsAfter(timestamp) {
        const transactions = this.graph.getTransactionsAfter(timestamp);
        return Promise.resolve(transactions);
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
     * @returns {string} message id
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
        console.log('not direct');
        return;
        const ws = new wsServer.WebSocket(`ws://${ peers[0] }`);

        ws.on('open', function open() {
            ws.send('something');
        });

        return Promise.resolve(peers);
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