const openpgp = require('openpgp');

class Message {
    /**
     * Initializes message with options object. 
     *
     * @public
     * @param {Object} options options object
     */
    constructor(options) {
        this.text = options.text;
        this.publicKey = options.publicKey;
    }

    /**
     * Calls allowed methods
     *
     * @public
     * @param {string} method The method, as defined in the class.
     * @param {Array} params Array or params to pass to the method.=
     * @returns {Array} array of params to pass to the method
     * @throws {Error} Throws error on invalid method
     */
    async encrypt() {
        const encrypted = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: this.text }), // input as Message object
            encryptionKeys: this.publicKey,
        });
        return encrypted;
    }
}

module.exports.instance = (options) => {
    return new Message(options);
};
module.exports.model = Message;