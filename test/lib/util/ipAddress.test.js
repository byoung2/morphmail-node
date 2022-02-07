const ipAddress = require('../../../lib/util/ipAddress');
const assert = require('assert');

describe('IpAddress', function() {
    describe('constuctor', function() {
        const string = '127.0.0.1';
        const addressFromString = ipAddress.instance(string);
        it('should accept string ipv4 address', function() {
            assert.equal(addressFromString.string, string);
        });

        const integer = 2130706433;
        let addressFromInteger = ipAddress.instance(integer);
        it('should accept integer representation of ipv4 address', function() {
            assert.equal(addressFromInteger.string, string);
        });

        const largeInteger = 4294967296;

        it('should not accept large integer representation of ipv4 address', function() {
            assert.throws(() => ipAddress.instance(largeInteger));
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