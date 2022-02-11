const ipAddress = require('../../../lib/util/ipAddress');
const assert = require('assert');

describe('IpAddress', function() {
    describe('constuctor', function() {
        const ipv4 = '127.0.0.1';
        const addressFromString = ipAddress.instance(ipv4);
        it('should accept string ipv4 address', function() {
            assert.equal(addressFromString.type, 'IPv4');
            assert.equal(addressFromString.string, ipv4);
        });

        const integer = 2130706433;
        let addressFromInteger = ipAddress.instance(integer);
        it('should accept integer representation of ipv4 address', function() {
            assert.equal(addressFromString.type, 'IPv4');
            assert.equal(addressFromInteger.string, ipv4);
        });

        const largeInteger = 4294967296;
        it('should not accept large integer representation of ipv4 address', function() {
            assert.throws(() => ipAddress.instance(largeInteger));
        });

        const ipv6Short = '2001:db8::8a2e:370:7334';
        it('should accept short string ipv6 address', function() {
            const addressFromString = ipAddress.instance(ipv6Short);
            assert.equal(addressFromString.type, 'IPv6');
            assert.equal(addressFromString.string, ipv6Short);
        });

        const ipv6Long = '2001:0db8:0000:0000:0000:8a2e:0370:7334';
        it('should accept long string ipv6 address', function() {
            const addressFromString = ipAddress.instance(ipv6Long);
            assert.equal(addressFromString.type, 'IPv6');
            assert.equal(addressFromString.string, ipv6Long);
        });
    });

    describe('toString', function() {
        const input = '127.0.0.1';
        const homeIpAddress = ipAddress.instance(input);
        it('should return the input used to instantiate class', function() {
            assert.equal(homeIpAddress.toString(), input);
        });
    });
});