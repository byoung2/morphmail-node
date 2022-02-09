const { VM } = require('vm2');

class VirtualMachine {
    constructor(code, wallet, action) {
        this.sandbox = {
            output(data) {
                return data;
            },
            wallet,
            action,
        }
        this.code = `
            ${ code }
            const cx = new Contract(wallet);
            output(cx[action[0]].apply(null, action[1]));
        `;
        this.vm = new VM({
            sandbox: this.sandbox
        });
    }

    run() {
        return this.vm.run(this.code);
    }
}

module.exports.instance = (code, wallet, action) => {
    return new VirtualMachine(code, wallet, action);
};
module.exports.model = VirtualMachine;

