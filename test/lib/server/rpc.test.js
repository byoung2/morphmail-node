const RPC = require('../../../lib/server/rpc');
const StorageManager = require('../../../lib/storage');
const assert = require('assert');

describe('RPC', function() {
    describe('methods', function() {
        const rpc = RPC.instance({
            serverId: '1P6P52vQxPFnTiWC6jETWPHsnbrQAeca5P',
            type: 'full',
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

        it('should throw an error on invalid method', async function() {
            assert.throws(() => rpc.call('fakeMethod', []));
        });
        after(function() {
            rpc.call('unRegisterPeer', [{address: testWallet}]);
        })
    });
});