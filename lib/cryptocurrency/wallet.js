const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const ECPair = require('ecpair');
const tinysecp = require('tiny-secp256k1');
const crypto = require('crypto');

const network = {
    messagePrefix: '\x18MorphMail Signed Message:\n',
    bech32: 'bc',
    bip32: { public: 76067358, private: 76066276 },
    pubKeyHash: 0,
    scriptHash: 5,
    wif: 128
};

class Wallet {
    constructor(wif = null) {
        if(wif) {
            this.keyPair = ECPair.ECPairFactory(tinysecp).fromWIF(wif, network);
        } else {
            this.keyPair = ECPair.ECPairFactory(tinysecp).makeRandom({ network });
        }
        this.privateKey = this.keyPair.privateKey;
    }

    signMessage(message) {
        const signature = bitcoinMessage.sign(message, this.privateKey, this.keyPair.compressed);
        return signature.toString('base64');
    }

    verifyMessage(message, address, signature) {
        return bitcoinMessage.verify(message, address, signature);
    }

    getKeyPair() {
        return {
            publicKey: this.keyPair.publicKey.toString('hex'),
            privateKey: this.keyPair.privateKey.toString('hex'),
        };
    }

    getWif() {
        return this.keyPair.toWIF();
    }

    getAddress() {
        const { address } = bitcoin.payments.p2pkh({ pubkey: this.keyPair.publicKey, network });
        return address;
    }
}

module.exports.instance = (wif) => {
    return new Wallet(wif);
};
module.exports.model = Wallet;