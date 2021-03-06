const bs58 = require('bs58');
const ipAddress = require('./util/ipAddress');
const StorageManager = require('./storage');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

module.exports.getNearestPeers = (address, ipAddresses) => {
    let goal = parseInt(bs58.decode(address).toString('hex').substring(40), 16) % 4294967296;
    let ipAddressLookup = {};

    ipAddresses.forEach(currIp => {
        let ipInstance = ipAddress.instance(currIp);
        if(ipInstance.type === 'IPv4') {
            ipAddressLookup[ipInstance.toInteger()] = currIp;
        } else if(ipInstance.type === 'IPv6') {
            ipAddressLookup[parseInt(ipInstance.toSortableKey().substring(16), 16) % 4294967296] = currIp;
        }
    });
    let sortByShortestDistance = (arr, number) => arr.sort((a, b) => Math.abs(a - number) - Math.abs(b - number));
    let sortedIpAddresses = sortByShortestDistance(Object.keys(ipAddressLookup), goal).map(currIp => {
        return ipAddressLookup[currIp];
    });
    return sortedIpAddresses;
};

module.exports.getNodeIpAddresses = (address, nodeGraph) => {
    let ipAddresses = [];
    if(!nodeGraph[address]) {
        return ipAddresses;
    }
    nodeGraph[address].parents.forEach(node => {
        if(nodeGraph[node]) {
            ipAddresses.push(nodeGraph[node].ipAddress);
        }
    });
    return module.exports.getNearestPeers(address, ipAddresses);
};

module.exports.broadcastToPeers = (data) => {
    const peerList = StorageManager.getPeers();
    const peersToBroadcast = Object.values(peerList)
        .filter(peer => {
            return peer.socket && (!peer.ipAddress || peer.ipAddress !== this.ipAddress);
        });
    const broadcastMessage = _.omit(data, 'socket');
    const broadcastId = uuidv4();
    peersToBroadcast.forEach(peer => {
        peer.socket.send(JSON.stringify({
            ...broadcastMessage,
            _bid: broadcastId,
        }));
    });
}