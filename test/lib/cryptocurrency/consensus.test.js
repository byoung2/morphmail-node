const graph = require('../../../lib/cryptocurrency/graph');
const wallet = require('../../../lib/cryptocurrency/wallet');
const consensus = require('../../../lib/cryptocurrency/consensus');
const _ = require('lodash');
const bs58 = require('bs58');
const SHA256 = require('crypto-js/sha256');
const chai = require('chai');
chai.should();

describe('Consensus mechanism', function() {
    describe('consistent', function() {
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
        let finalTxId = 'genesis';
        for(let i=0; i<2; i++) {
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

        it('should resolve when graphs are identical', function() {
            const graphs = [_.clone(testGraph.toObject()), _.clone(testGraph.toObject()), _.clone(testGraph.toObject())];
            const currentConsensus = consensus.instance(graphs);
            const resolvedGraph = currentConsensus.resolveGraphs();
            resolvedGraph.should.equal(graphs[0]);
        });

        it('should resolve when graphs have identical elements in different order', function() {
            const graphs = [_.clone(testGraph.toObject()), _.clone(testGraph.toObject())];
            const unordered = {};
            Object.keys(testGraph.toObject()).reverse().forEach(txId => {
                unordered[txId] = testGraph.toObject()[txId];
            });
            graphs.push(unordered);
            const currentConsensus = consensus.instance(graphs);
            const resolvedGraph = currentConsensus.resolveGraphs();
            resolvedGraph.should.equal(graphs[0]);
        });

        it('should resolve when graphs have discrepancies but there is a majority consensus', function() {
            const graphs = [_.clone(testGraph.toObject()), _.clone(testGraph.toObject())];
            const altered = _.clone(testGraph.toObject());
            const transaction = {
                to: testWalletTo.getAddress(),
                from: testWalletFrom.getAddress(),
                amount: 200,
                data: {},
            };
            transaction.signature = testWalletFrom.signMessage(JSON.stringify(transaction));
            const lastTxId = Object.keys(altered).pop();
            altered[lastTxId] = {...altered[lastTxId], ...transaction};
            altered[lastTxId].hash = bs58.encode(Buffer.from(SHA256(JSON.stringify(_.omit(altered[lastTxId], 'hash'))).toString(), 'hex'));
            graphs.unshift(altered);
            const currentConsensus = consensus.instance(graphs);
            const resolvedGraph = currentConsensus.resolveGraphs();
            resolvedGraph[lastTxId].amount.should.equal(100);
        });
    });
});