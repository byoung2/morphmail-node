const bs58 = require('bs58');
const ipAddress = require('./util/ipAddress');

module.exports = {
    getNearestPeers: (address, ipAddresses) => {
        let goal = parseInt(bs58.decode(address).toString('hex').substring(40), 16) % 4294967296;
        ipAddresses = ipAddresses.map(currIp => {
            return ipAddress.instance(currIp).toInteger();
        });
        let sortByShortestDistance = (arr, number) => arr.sort((a, b) => Math.abs(a - number) - Math.abs(b - number));
        return sortByShortestDistance(ipAddresses, goal).map(currIp => {
            return ipAddress.instance(currIp).fromInteger(currIp);
        });
    }
}