const VirtualMachine = require('../../lib/vm');
const wallet = require('../../lib/cryptocurrency/wallet');
const assert = require('assert');

describe('VM', function() {
    describe('run code', function() {
        it('should run the code in the contract', function() {
            const code = `
                class Contract {
                    constructor(wallet) {
                        this.wallet = wallet;
                    }

                    getSchedule() {
                        return 'immediate';
                    }

                    getAddressByAlias(alias) {
                        const lookup = {
                            'morpheus': '1B4JMr5LaCUrfMeRZSChNmnTiQpkQeoDRm'
                        };
                        return lookup[alias];
                    }
                }
            `;
            const testWallet = wallet.instance();
            const action = ['getAddressByAlias', ['morpheus']];
            const vm = VirtualMachine.instance(code, testWallet.getAddress(), action);
            const lookup = vm.run();
            assert.equal(lookup, '1B4JMr5LaCUrfMeRZSChNmnTiQpkQeoDRm');
        });

        it('should throw an error when the contract does not run successfully', function() {
            const code = `
                class Contract {
                    constructor(wallet) {
                        this.wallet = wallet;
                    }

                    getSchedule() {
                        return 'immediate';
                    }

                    getAddressByAlias(alias) {
                        const lookup = {
                            'morpheus': '1B4JMr5LaCUrfMeRZSChNmnTiQpkQeoDRm'
                        };
                        return lookup[alias];
                    }
                }
            `;
            const testWallet = wallet.instance();
            const action = ['fakeMethod', ['morpheus']];
            const vm = VirtualMachine.instance(code, testWallet.getAddress(), action);
            assert.throws(() => vm.run());
        });

        it('should return default schedule', function() {
            const code = `
                class Contract {
                    constructor(wallet) {
                        this.wallet = wallet;
                    }

                    getSchedule() {
                        return 'immediate';
                    }

                    getAddressByAlias(alias) {
                        const lookup = {
                            'morpheus': '1B4JMr5LaCUrfMeRZSChNmnTiQpkQeoDRm'
                        };
                        return lookup[alias];
                    }
                }
            `;
            const testWallet = wallet.instance();
            const action = ['getSchedule', []];
            const vm = VirtualMachine.instance(code, testWallet.getAddress(), action);
            const schedule = vm.run();
            assert.equal(schedule, 'immediate');
        });

        it('should return hourly schedule', function() {
            const code = `
                class Contract {
                    constructor(wallet) {
                        this.wallet = wallet;
                    }

                    getSchedule() {
                        return 'hourly';
                    }

                    getAddressByAlias(alias) {
                        const lookup = {
                            'morpheus': '1B4JMr5LaCUrfMeRZSChNmnTiQpkQeoDRm'
                        };
                        return lookup[alias];
                    }
                }
            `;
            const testWallet = wallet.instance();
            const action = ['getSchedule', []];
            const vm = VirtualMachine.instance(code, testWallet.getAddress(), action);
            const schedule = vm.run();
            assert.equal(schedule, 'hourly');
        });
    });
});