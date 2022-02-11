const ipaddr = require('ipaddr.js');

class IpAddress {
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

    toString() {
        return this.string;
    }

    toSortableKey() {
        if(this.type === 'IPv6') {
            return this.meta.parts.map(part => part.toString(16).padStart(4, '0')).join('');
        }
    }

    toInteger() {
        let d = this.input.split('.');
        return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
    }

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