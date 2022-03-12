const StorageManager = require('./../storage');
const peer = require('./../peer');
const _ = require('lodash');
const wsServer = require('ws');

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