const StorageManager = require('./../storage');

class RPC {
    registerPeer(address, type) {
        StorageManager.addClient({
            address,
            type,
        });
        return Promise.resolve(true);
    }

    getServerId() {
        return Promise.resolve('1P6P52vQxPFnTiWC6jETWPHsnbrQAeca5P');
    }

    call(method, params) {
        if(!this[method]) {
            throw new Error('Invalid method');
        }
        return this[method].apply(null, params);
    }
}

module.exports.instance = () => {
    return new RPC();
};
module.exports.model = RPC;