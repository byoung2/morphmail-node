const RPC = require('../../../lib/server/rpc');
const StorageManager = require('../../../lib/storage');
const assert = require('assert');

describe('RPC', function() {
    describe('methods', function() {
        const rpc = RPC.instance();
        it('should call allowed method', async function() {
            const testWallet = '1HUqrQ9gkyDmkxnJ1TwSi1AbTncAfGGthM';
            const res = await rpc.call('registerPeer', [testWallet, 'client']);
            const storedClient = StorageManager.getClient(testWallet);
            assert.equal(res, true);
            assert.equal(storedClient.address, testWallet);
        });

        it('should return string data', async function() {
            const res = await rpc.call('getServerId', []);
            assert.equal(res.length, 34);
        });

        it('should throw an error on invalid method', async function() {
            assert.throws(() => rpc.call('fakeMethod', []));
        });
    });
});