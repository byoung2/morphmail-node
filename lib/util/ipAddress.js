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
    }

    toString() {
        return this.string;
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