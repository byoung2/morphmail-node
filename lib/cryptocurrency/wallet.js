const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const ECPair = require('ecpair');
const tinysecp = require('tiny-secp256k1');

const network = {
    messagePrefix: '\x18MorphMail Signed Message:\n',
    bech32: 'bc',
    bip32: { public: 76067358, private: 76066276 },
    pubKeyHash: 0,
    scriptHash: 5,
    wif: 128
};

/**
 * Verifies that message signature is valid using a minimal representation
 * of the message, the wallet address, and signature string
 *
 * @public
 * @param {Object} message The message to verify.
 * @param {string} address The wallet address that sent message
 * @param {string} signature The signature
 * @returns {boolean} true on success, false on failure
 */
function verifyMessage(message, address, signature) {
    return bitcoinMessage.verify(message, address, signature);
}

class Wallet {
    /**
     * Initializes wallet from optional WIF or creates a random one
     *
     * @public
     * @param {string=} wif The WIF to import.
     */
    constructor(wif = null) {
        if(wif) {
            this.keyPair = ECPair.ECPairFactory(tinysecp).fromWIF(wif, network);
        } else {
            this.keyPair = ECPair.ECPairFactory(tinysecp).makeRandom({ network });
        }
        this.privateKey = this.keyPair.privateKey;
    }

    /**
     * Signs message using the private key for the wallet
     *
     * @public
     * @param {Object} message The message to sign.
     * @returns {string} the base64 signature
     */
    signMessage(message) {
        const signature = bitcoinMessage.sign(message, this.privateKey, this.keyPair.compressed);
        return signature.toString('base64');
    }

    /**
     * Verifies message signature using the wallet address and signature
     *
     * @public
     * @param {Object} message The message to verify signature of.
     * @param {string} address the wallet address
     * @param {string} signature the signature to verify
     * @returns {boolean} true on success, false on failure
     */
    verifyMessage(message, address, signature) {
        return verifyMessage(message, address, signature);
    }

    /**
     * Returns the key pair for the current wallet
     *
     * @public
     * @returns {Object} returns object with publicKey and privateKey 
     */
    getKeyPair() {
        return {
            publicKey: this.keyPair.publicKey.toString('hex'),
            privateKey: this.keyPair.privateKey.toString('hex'),
        };
    }

    /**
     * Returns the WIF (wallet import format) for the current wallet
     *
     * @public
     * @returns {string} returns WIF string 
     */
    getWif() {
        return this.keyPair.toWIF();
    }

    /**
     * Returns the address the current wallet
     *
     * @public
     * @returns {string} returns address string 
     */
    getAddress() {
        const { address } = bitcoin.payments.p2pkh({ pubkey: this.keyPair.publicKey, network });
        return address;
    }
}

module.exports.instance = (wif) => {
    return new Wallet(wif);
};
module.exports.model = Wallet;
module.exports.verifyMessage = verifyMessage;