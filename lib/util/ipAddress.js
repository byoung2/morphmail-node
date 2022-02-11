const ipaddr = require('ipaddr.js');

class IpAddress {
    /**
     * Instantiates object using IPv4 or IPv6 address
     *
     * @public
     * @param {string|number} input The input IPv4 or IPv6 address.
     */
    constructor(input) {
        if(typeof input === 'string') {
            this.input = input;
            this.string = input;
        } else if(typeof input === 'number') {
            if(input > 4294967295) {
                throw 'Invalid IP address';
            }
            this.input = input;
            this.string = this.fromInteger(input);
        }
        this.meta = ipaddr.process(this.string);
        if(this.meta.octets) {
            this.type = 'IPv4';
        } else if(this.meta.parts) {
            this.type = 'IPv6';
        }
    }

    /**
     * Converts IP address to string 
     *
     * @public
     * @returns {string} the string representation of the address
     */
    toString() {
        return this.string;
    }

    /**
     * Converts IPv6 address to sortable string 
     *
     * @public
     * @returns {string} the string representation of the address
     */
    toSortableKey() {
        if(this.type === 'IPv6') {
            return this.meta.parts.map(part => part.toString(16).padStart(4, '0')).join('');
        }
    }

    /**
     * Converts IPv4 address to sortable integer 
     *
     * @public
     * @returns {integer} the integer representation of the address
     */
    toInteger() {
        let d = this.input.split('.');
        return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
    }

    /**
     * Converts sortable integer to IPv4 address
     *
     * @public
     * @param {integer} integer integer representation of the address
     * @returns {string} string representation of address
     */
    fromInteger(integer) {
        let d = integer%256;
        for (var i = 3; i > 0; i--) { 
            integer = Math.floor(integer/256);
            d = integer%256 + '.' + d;
        }
        return d;
    }
}

module.exports.instance = (string) => {
    return new IpAddress(string);
};
module.exports.model = IpAddress;