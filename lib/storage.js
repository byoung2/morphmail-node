const storage = {
    peers: {},
    clients: {}
};

const StorageManager = {
    addPeer(peer) {
        storage.peers[peer.address] = peer;
    },

    getPeer(address) {
        return storage.peers[address];
    },

    addClient(client) {
        storage.clients[client.address] = client;
    },

    getClient(address) {
        return storage.clients[address];
    },
};

module.exports = StorageManager;