const peer = require('../../lib/peer');
const assert = require('assert');

describe('Peer', function() {
    describe('find closest', function() {
        it('should find the closest peers by IPv4 address', function() {
            const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';
            const ipAddresses = [
                '36.146.80.237',
                '186.143.177.136',
                '125.227.154.208',
                '16.66.45.157',
                '88.48.48.31',
                '156.112.70.192',
                '249.153.115.133',
                '137.16.160.250',
                '66.196.171.158',
                '144.91.68.187',
                '186.231.103.124',
                '117.140.43.64',
                '106.28.186.115',
                '71.29.52.2',
                '26.196.7.217',
            ];
            const sortedIpAddresses = peer.getNearestPeers(testWallet, ipAddresses);
            assert.equal(sortedIpAddresses[0], '16.66.45.157');
        });

        it('should find the closest peers by IPv6 address', function() {
            const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';
            const ipAddresses = [
                'd23f:a82c:8950:032a:58c3:fe31:31db:9587',
                'e4e9:995e:4780:cc12:9987:03e9:787e:62cb',
                'ce0e:93a3:d11a:5e93:acb7:bc28:3ae1:beec',
                'd274:8c1a:0585:6710:8fb3:13b7:35f7:49c9',
                '2d7f:4059:2208:f578:a20f:06e0:a28c:db24',
                'bf9a:9ed8:0290:66cc:e0e6:7af2:461b:ae2e',
                '2bab:8f74:59e3:a77e:2a0d:da34:04bd:fab8',
                'a50c:d9b5:c884:0962:96ba:f4f8:60b0:c4b7',
                'bd8f:2757:4e5a:2458:b89f:992d:616f:42e8',
                '7574:9791:27de:bd69:fe58:2e42:1d2a:26aa',
            ];
            const sortedIpAddresses = peer.getNearestPeers(testWallet, ipAddresses);
            assert.equal(sortedIpAddresses[0], '2bab:8f74:59e3:a77e:2a0d:da34:04bd:fab8');
        });

        it('should find the closest peers by IPv4 and IPv6 addresses', function() {
            const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';
            const ipAddresses = [
                '36.146.80.237',
                '186.143.177.136',
                '125.227.154.208',
                '16.66.45.157',
                '88.48.48.31',
                '156.112.70.192',
                '249.153.115.133',
                '137.16.160.250',
                '66.196.171.158',
                '144.91.68.187',
                '186.231.103.124',
                '117.140.43.64',
                '106.28.186.115',
                '71.29.52.2',
                '26.196.7.217',
                'd23f:a82c:8950:032a:58c3:fe31:31db:9587',
                'e4e9:995e:4780:cc12:9987:03e9:787e:62cb',
                'ce0e:93a3:d11a:5e93:acb7:bc28:3ae1:beec',
                'd274:8c1a:0585:6710:8fb3:13b7:35f7:49c9',
                '2d7f:4059:2208:f578:a20f:06e0:a28c:db24',
                'bf9a:9ed8:0290:66cc:e0e6:7af2:461b:ae2e',
                '2bab:8f74:59e3:a77e:2a0d:da34:04bd:fab8',
                'a50c:d9b5:c884:0962:96ba:f4f8:60b0:c4b7',
                'bd8f:2757:4e5a:2458:b89f:992d:616f:42e8',
                '7574:9791:27de:bd69:fe58:2e42:1d2a:26aa',
            ];
            const sortedIpAddresses = peer.getNearestPeers(testWallet, ipAddresses);
            assert.equal(sortedIpAddresses[0], '2bab:8f74:59e3:a77e:2a0d:da34:04bd:fab8');
        });
    });

    describe('node graph', function() {
        const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';

        const testNodeGraph = {
            '1EJ6SkkQkJebkMjaRXsnPGvbamVQUYa9UB': {
                address: '1EJ6SkkQkJebkMjaRXsnPGvbamVQUYa9UB',
                parents: [],
                type: 'node',
                ipAddress: '36.146.80.237',
            },
            '154dqG1Rt4yGqxqkAtuZAYWozfUNkb52Mp': {
                address: '154dqG1Rt4yGqxqkAtuZAYWozfUNkb52Mp',
                parents: [],
                type: 'node',
                ipAddress: '186.143.177.136',
            },
            '1JaDkegoNM52Ckd68hiqRM8hzbV8UTkjdR': {
                address: '1JaDkegoNM52Ckd68hiqRM8hzbV8UTkjdR',
                parents: [],
                type: 'node',
                ipAddress: '7574:9791:27de:bd69:fe58:2e42:1d2a:26aa',
            },
            '1P6P52vQxPFnTiWC6jETWPHsnbrQAeca5P': {
                address: '1P6P52vQxPFnTiWC6jETWPHsnbrQAeca5P',
                parents: ['1JaDkegoNM52Ckd68hiqRM8hzbV8UTkjdR'],
                type: 'node',
                ipAddress: 'bd8f:2757:4e5a:2458:b89f:992d:616f:42e8',
            },
            '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM': {
                address: '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM',
                parents: [
                    '1EJ6SkkQkJebkMjaRXsnPGvbamVQUYa9UB', 
                    '154dqG1Rt4yGqxqkAtuZAYWozfUNkb52Mp',
                    '1JaDkegoNM52Ckd68hiqRM8hzbV8UTkjdR',
                ],
                type: 'client',
            },
        };
        it('should return node ip addresses for a client address that exists in the graph', function() {
            const ipAddresses = peer.getNodeIpAddresses(testWallet, testNodeGraph);
            assert.equal(ipAddresses.length, 3);
            assert.equal(ipAddresses[0], '7574:9791:27de:bd69:fe58:2e42:1d2a:26aa');
        });
    });
});