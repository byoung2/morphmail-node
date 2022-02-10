const peer = require('../../lib/peer');
const wallet = require('../../lib/cryptocurrency/wallet');
const assert = require('assert');

describe('Peer', function() {
    describe('find closest', function() {
        it('should find the closest peers by IP address', function() {
            const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';
            const ipAddresses = [
                "36.146.80.237",
                "186.143.177.136",
                "125.227.154.208",
                "16.66.45.157",
                "88.48.48.31",
                "156.112.70.192",
                "249.153.115.133",
                "137.16.160.250",
                "66.196.171.158",
                "144.91.68.187",
                "186.231.103.124",
                "117.140.43.64",
                "106.28.186.115",
                "71.29.52.2",
                "26.196.7.217"
            ];
            const sortedIpAddresses = peer.getNearestPeers(testWallet, ipAddresses);
            assert.equal(sortedIpAddresses[0], '16.66.45.157');
        });
    });
});