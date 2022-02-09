const graph = require('../../../lib/cryptocurrency/graph');
const wallet = require('../../../lib/cryptocurrency/wallet');
const assert = require('assert');

describe('DAG', function() {
    describe('graph', function() {
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
                hash: 'hash'
            }
        });
        const transaction = {
            to: testWalletTo.getAddress(),
            from: testWalletFrom.getAddress(),
            amount: 100,
        };
        transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
        const vertex = testGraph.addVertex('genesis', transaction);

        it('should return vertex in graph', function() {
            assert.equal(vertex.parent, 'genesis');
        });

        it('should throw error on nonexistant parent vertex', function() {
            assert.throws(() => testGraph.addVertex('def', 'fake'));
        });

        it('should throw error on invalid signature', function() {
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 100,
            };
            transaction.signature = 'fake signature';
            assert.throws(() => testGraph.addVertex('genesis', transaction));
        });

        it('should throw error on invalid branch hash', function() {
            let finalTxId = 'genesis';
            for(let i=0; i<10; i++) {
                const transaction = {
                    to: testWalletTo.getAddress(),
                    from: testWalletFrom.getAddress(),
                    amount: 100,
                };
                transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
                const vertex = testGraph.addVertex(finalTxId, transaction);
                finalTxId = vertex.txId;
            }
            Object.keys(testGraph.graph).forEach(txId => {
                testGraph.graph[txId].amount = 99;
            });
            assert.throws(() => testGraph.verifyChain(finalTxId));
        });

        it('should throw error on insufficient funds', function() {
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 10000,
            };
            transaction.signature = 'fake signature';
            assert.throws(() => testGraph.addVertex('genesis', transaction));
        });
    });
});