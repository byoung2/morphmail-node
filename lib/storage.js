const storage = {
    peers: {},
};

const StorageManager = {
    addPeer(peer) {
        storage.peers[peer.address] = peer;
    },

    removePeer(address) {
        delete storage.peers[address];
    },

    getPeer(address) {
        return storage.peers[address];
    },

    getPeers() {
        return storage.peers;
    },
};

module.exports = StorageManager;