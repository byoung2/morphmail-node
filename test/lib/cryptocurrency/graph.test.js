const graph = require('../../../lib/cryptocurrency/graph');
const wallet = require('../../../lib/cryptocurrency/wallet');
const assert = require('assert');

const publicKeyArmored = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
=k1FN
-----END PGP PUBLIC KEY BLOCK-----`;

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
                hash: 'hash',
                data: {},
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

        it('should return transactions after timestamp', function() {
            const latest = testGraph.getTransactionsAfter('2022-02-07T03:49:01+00:00');
            assert.equal(latest.length, 1);
        });

        it('should return child transactions of vertex', function() {
            let finalTxId = 'genesis';
            let parent;
            for(let i=0; i<10; i++) {
                if(i === 5) {
                    parent = finalTxId;
                }
                const transaction = {
                    to: testWalletTo.getAddress(),
                    from: testWalletFrom.getAddress(),
                    amount: 100,
                    data: {},
                };
                transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
                const vertex = testGraph.addVertex(finalTxId, transaction);
                finalTxId = vertex.txId;
            }
            const tree = testGraph.getTransactionTree(parent, 3);
            assert.equal(Object.keys(tree).length, 3);
        });

        it('should throw error on nonexistant parent vertex', function() {
            assert.throws(() => testGraph.addVertex('def', 'fake'));
        });

        it('should throw error on invalid signature', function() {
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 100,
                data: {},
            };
            transaction.signature = 'fake signature';
            assert.throws(() => testGraph.addVertex('genesis', transaction));
        });

        it('should throw error on insufficient funds', function() {
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 10000,
                data: {},
            };
            transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
            assert.throws(() => testGraph.addVertex('genesis', transaction));
        });

        it('should find an address for an alias', function() {
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 1,
                data: {
                    alias: 'username'
                },
            };
            transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
            const lastTxId = testGraph.getLatestTxID();
            testGraph.addVertex(lastTxId, transaction);
            const address = testGraph.getAddressForAlias('username');
            assert.equal(address, testWalletFrom.getAddress());
        });

        it('should find a PGP key for an address', function() {
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 1,
                data: {
                    pgpPublicKey: publicKeyArmored,
                },
            };
            transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
            const lastTxId = testGraph.getLatestTxID();
            testGraph.addVertex(lastTxId, transaction);
            const key = testGraph.getPGPKeyForAddress(testWalletFrom.getAddress());
            assert.equal(key, publicKeyArmored);
        });

        it('should throw error on invalid branch hash', function() {
            let finalTxId = 'genesis';
            for(let i=0; i<10; i++) {
                const transaction = {
                    to: testWalletTo.getAddress(),
                    from: testWalletFrom.getAddress(),
                    amount: 100,
                    data: {},
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
    });
});