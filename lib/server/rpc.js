const StorageManager = require('./../storage');

class RPC {
    constructor(options) {
        this.serverId = options.serverId;
    }

    registerPeer(address, type) {
        StorageManager.addClient({
            address,
            type,
        });
        return Promise.resolve(true);
    }

    getServerId() {
        return Promise.resolve(this.serverId);
    }

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