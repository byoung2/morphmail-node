const wallet = require('../../../lib/cryptocurrency/wallet');
const chai = require('chai');
chai.should();

describe('Cryptocurrency', function() {
    describe('wallet', function() {
        const testWallet = wallet.instance();

        it('should return a keyPair', function() {
            const keyPair = testWallet.getKeyPair();
            keyPair.should.have.property('publicKey');
            keyPair.should.have.property('privateKey');
        });

        it('should return a valid WIF', function() {
            const wif = testWallet.getWif();
            wif.should.have.length(52);
        });

        it('should create wallet from imported WIF', function() {
            const wif = testWallet.getWif();
            const testWallet2 = wallet.instance(wif);
            const keyPair = testWallet.getKeyPair();
            const keyPair2 = testWallet2.getKeyPair();
            keyPair.publicKey.should.equal(keyPair2.publicKey);
            keyPair.privateKey.should.equal(keyPair2.privateKey);
        });

        it('should sign a message with key', function() {
            const message = 'This is a test';
            const signature = testWallet.signMessage(message);
            const verify = testWallet.verifyMessage(message, testWallet.getAddress(), signature);
            verify.should.equal(true);
        });

        it('should verify a signature generated in a browser', function() {
            const message = 'hello';
            const signature = 'IE0O9+UkbOsWPAvlfBCMqp/u5W4E3LaPsNjeFMlj3+wUpg7ZoycSqQ+/7BPTVFQsfPSvshqI1uOje6pXVxGFUX8=';
            const verify = testWallet.verifyMessage(message, '1PBELaJoX5ukxE1C7QWYdjrhNHrXnSRVhX', signature);
            verify.should.equal(true);
        });
    });
});
