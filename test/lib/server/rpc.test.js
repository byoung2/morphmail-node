const RPC = require('../../../lib/server/rpc');
const StorageManager = require('../../../lib/storage');
const graph = require('../../../lib/cryptocurrency/graph');
const wallet = require('../../../lib/cryptocurrency/wallet');
const assert = require('assert');

describe('RPC', function() {
    describe('methods', function() {
        const testWalletFrom = wallet.instance();
        const testWalletTo = wallet.instance();
        const testGraph = graph.instance({
            genesis: {
                txId: 'genesis',
                parent: null,
                to: testWalletFrom.getAddress(),
                from: null,
                amount: 10000,
                timestamp: '2022-02-07T03:49:01+00:00',
                hash: 'hash',
                data: {},
            }
        });
        const transaction = {
            to: testWalletTo.getAddress(),
            from: testWalletFrom.getAddress(),
            amount: 100,
            data: {
                alias: 'username'
            },
        };
        transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
        testGraph.addVertex('genesis', transaction);
        const rpc = RPC.instance({
            serverId: '1P6P52vQxPFnTiWC6jETWPHsnbrQAeca5P',
            type: 'full',
            graph: testGraph,
        });
        const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';
        it('should call allowed method', async function() {
            const res = await rpc.call('registerPeer', [{address: testWallet, type: 'client', parents:[]}]);
            const storedClient = StorageManager.getPeer(testWallet);
            assert.equal(res, true);
            assert.equal(storedClient.address, testWallet);
        });

        it('should return string data', async function() {
            const res = await rpc.call('getServerId', []);
            assert.equal(res, '1P6P52vQxPFnTiWC6jETWPHsnbrQAeca5P');
        });

        it('should find an alias in the graph', async function() {
            const res = await rpc.call('getAddressForAlias', ['username']);
            assert.equal(res, testWalletFrom.getAddress());
        });

        it('should throw an error on invalid method', async function() {
            assert.throws(() => rpc.call('fakeMethod', []));
        });
        
        after(function() {
            rpc.call('unRegisterPeer', [{address: testWallet}]);
        })
    });
});