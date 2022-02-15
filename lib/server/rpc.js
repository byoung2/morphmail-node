const StorageManager = require('./../storage');

class RPC {
    /**
     * Initializes rpc with options object. At minimum, serverId is required
     *
     * @public
     * @param {Object} options options object, serverId required.
     */
    constructor(options) {
        this.serverId = options.serverId;
    }

    /**
     * Registers a peer by address. Peers can either be of type client, which 
     * can connect to a node but is not publicly addressable by IP or hostname, 
     * or node, which is reachable by IP or hostname
     *
     * @public
     * @param {string} address The MorphMail address of the peer.
     * @param {string} type client or node, depending on type
     * @returns {Promise} returns a resolved promise with a boolean value
     */
    registerPeer(data) {
        const {address, type} = data;
        StorageManager.addClient({
            address,
            type,
        });
        return Promise.resolve(true);
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
     * Calls allowed methods
     *
     * @public
     * @param {string} method The method, as defined in the class.
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