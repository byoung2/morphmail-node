const graph = require('../../../lib/cryptocurrency/graph');
const wallet = require('../../../lib/cryptocurrency/wallet');
const consensus = require('../../../lib/cryptocurrency/consensus');
const _ = require('lodash');
const bs58 = require('bs58');
const SHA256 = require('crypto-js/sha256');
const chai = require('chai');
chai.should();
const fs = require('fs');

describe('Consensus mechanism', function() {
    describe('consistent', function() {
        const testWalletFrom = wallet.instance();
        const testWalletTo = wallet.instance();
        try {
            fs.unlinkSync(`db/transactions-qa.db`);
        } catch(e) {

        }

        let testData = [
            ["genesis","","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ",10000,"",0,"2022-02-07T03:49:01+00:00","hash","",""],
            ["jtdiNAhgaMDXzbgcBGsE93Wd7AhjurEi2cCgmQAL2JLiW4WE4","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"genesis",0.00001,"2022-06-10T15:26:17.679Z","Cjurg6ddEJPB8nSoaGedr5nd7EjoXvVvcUbTpP9Pjpmw","hash","ILlTRdbvGlFAw3tnKFXvLOXEx5jA/ISt8+gdRT5dkCjId7+uerqi/RQyBy51L28WmkYWRPuADS0DGgbd40lo/Dw=", {}],
            ["jtdiNhs3BSvxiWK9bdCumhhXaDfMc39PGyNfkisYKA7ogMrgg","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"genesis",0.00001,"2022-06-10T15:26:17.687Z","aceUq3C16urnt67TvFGPqSuvhmTZpnC2VPeLcgu1uFu","hash","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
            ["jtdiaeQrc2rxAUFmgJw66Y7WEX2GgSnwUAmJHxptD4sqwzGX2","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"jtdiNhs3BSvxiWK9bdCumhhXaDfMc39PGyNfkisYKA7ogMrgg",0.00001,"2022-06-10T15:26:17.698Z","6zLsys5tRfvhbRZuJvsca99EBmfJSdknWVJH81kUJbMy","aceUq3C16urnt67TvFGPqSuvhmTZpnC2VPeLcgu1uFu","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
            ["jtdiatkN7csuLFgLm6SEwwPHwH229zrcFfVsDDF1iLSBHYfcL","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"jtdiaeQrc2rxAUFmgJw66Y7WEX2GgSnwUAmJHxptD4sqwzGX2",0.00001,"2022-06-10T15:26:17.703Z","BekZnuoeApyyfjruom14ewHwtqTfV1uEPzwTUFhwn7fN","6zLsys5tRfvhbRZuJvsca99EBmfJSdknWVJH81kUJbMy","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
            ["jtdibBii9krvdqtfsahg9ntf5EnZuVmDnZi3eBLZxYEwwnV2Y","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"jtdiatkN7csuLFgLm6SEwwPHwH229zrcFfVsDDF1iLSBHYfcL",0.00001,"2022-06-10T15:26:17.708Z","GTCyn8XdhnUoo6t4cTsPX1qx46sdoREVdR7zjrWgDqqv","BekZnuoeApyyfjruom14ewHwtqTfV1uEPzwTUFhwn7fN","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
            ["jtdibF9rJtbMbDsWZFZSPYHmeUii26nvJUPYkh6sZ7Eqv6M1A","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"jtdibBii9krvdqtfsahg9ntf5EnZuVmDnZi3eBLZxYEwwnV2Y",0.00001,"2022-06-10T15:26:17.713Z","2dpDWyEdvUJy6B8xWz7oFS2HRutX1JwZ5kfUMNoWXttm","GTCyn8XdhnUoo6t4cTsPX1qx46sdoREVdR7zjrWgDqqv","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
            ["jtdibYJaVeNpqtp5oFRiq9uX9huUHJgmgqZHLcTK4aRzmhhig","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"jtdibF9rJtbMbDsWZFZSPYHmeUii26nvJUPYkh6sZ7Eqv6M1A",0.00001,"2022-06-10T15:26:17.720Z","GBHELFEqcbLnYZhcgXXrKHwXppu1ck9ugjjjdbyUFMpe","2dpDWyEdvUJy6B8xWz7oFS2HRutX1JwZ5kfUMNoWXttm","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
            ["jtdibqTuJjp4wWw7E25bdP5TgDixuN3Xm59f5Uf9gMGV8t6ye","1BmzubemYC5TNPuD9vgjcE584VUteGxUtZ","18cEbkYJUB9RxMEJUuzBd5LtJintEiusqW",100,"jtdibYJaVeNpqtp5oFRiq9uX9huUHJgmgqZHLcTK4aRzmhhig",0.00001,"2022-06-10T15:26:17.725Z","DqXpqhp9QmHkyaJpRsCrxB4JRBnCBktT2oL1HkfRWpF2","GBHELFEqcbLnYZhcgXXrKHwXppu1ck9ugjjjdbyUFMpe","Hy9dw450HJiS0cE1/qP1lH+pHBo1tuM5XLRevF34LtIsefexQCzwm0z6gRtWkdl8vP7Zz1I1LQqp8VYApYWosa0=", {}],
        ];
        let testGraphObj = {};
        testData.forEach(row => {
            testGraphObj[row[0]] = {
                txId: row[0],
                from: row[1],
                to: row[2],
                amount: row[3],
                parent: row[4],
                fee: row[5],
                timestamp: row[6],
                hash: row[7],
                parentHash: row[8],
                signature: row[9],
                data: row[10],
            }
        })
        const testGraph = graph.instance(testGraphObj, 'qa');

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