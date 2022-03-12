const inquirer = require("inquirer");
const wallet = require('./../cryptocurrency/wallet');

module.exports = {
    init: function(ip) {
        console.log('\n\nAnswer the following questions to get started\n\n');
        return inquirer.prompt([
            {
                name: "hasWallet",
                message: "Do you have a valid MorphMail wallet address?",
                type: "list",
                choices: ["no", "yes"]
            },
            {
                name: "generateWallet",
                message: "Would you like to generate a wallet address now?",
                type: "list",
                choices: ["no", "yes"],
                default: 'yes',
                when: (answers) => {
                    if (answers.hasWallet === "no") {
                        return true;
                    }
                },
            },
            {
                name: "wallet",
                message: function(answers) {
                    if(answers.generateWallet === 'yes') {
                        return "Press enter to use generated address"
                    }
                    return "Please enter MorphMail wallet address";
                },
                type: "input",
                default: async (answers) => {
                    if(answers.generateWallet === 'yes') {
                        const newWallet = wallet.instance();
                        const keyPair = newWallet.getKeyPair();
                        answers.privateKey = keyPair.privateKey;
                        answers.walletAddress = newWallet.getAddress();
                        return keyPair.publicKey;
                    }
                },
                validate: async (input) => {
                    if (input.length < 10) {
                       return "This doesn't appear to be a valid wallet address";
                    }
              
                    return true;
                }
            },
            {
                name: "staticIP",
                message: "Does this node have a static IP address?",
                type: "list",
                choices: ["no", "yes"]
            },
            {
                name: "ipAddress",
                message:  function() {
                    if(ip) {
                        return "Press enter to use detected IP"
                    }
                    return "Enter static IP address";
                }, 
                type: "input",
                default: ip,
                validate: async (input) => {
                    if (!input.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) {
                       return "This doesn't appear to be a valid IP address";
                    }
              
                    return true;
                },
                when: (answers) => {
                    if (answers.staticIP === "yes") {
                        return true;
                    }
                },
            },
            {
                name: "nodeType",
                message: "What type of node would you like to run?",
                type: "list",
                choices: ["minimal", "full", "external"],
                when: (answers) => {
                    if (answers.staticIP === "yes") {
                        return true;
                    }
                },
            },
            {
                name: "hostname",
                message: "Please enter the hostname for this node (e.g. morphmail.example.com)",
                type: "input",
                when: (answers) => {
                    if (answers.nodeType === "external") {
                        return true;
                    }
                },
                validate: async (input) => {
                    if (!input.match(/^(\w+\.)+\w+/gi)) {
                       return "This doesn't appear to be a valid hostname";
                    }
              
                    return true;
                }
            },
            {
                name: "hasPeer",
                message: "Do you have a specific peer you want to connect to?",
                type: "list",
                choices: ["no", "yes"]
            },
            {
                name: "peer",
                message: "Enter IP address or hostname of peer",
                type: "input",
                validate: async (input) => {
                    if (!input.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/) &&
                        !input.match(/^(\w+\.)+\w+/gi)) {
                       return "This doesn't appear to be a valid IP address or hostname";
                    }
              
                    return true;
                },
                when: (answers) => {
                    if (answers.hasPeer === "yes") {
                        return true;
                    }
                },
            },
        ])
        .then(answers => {
            answers.serverId = wallet.instance().getAddress();
            console.log(`\n\nPlease copy the following public key and store it in a safe place.
            If you lose it, it will be impossible to recover, and you will not be able to access
            any funds in the associated wallet.`);
            console.log(answers.privateKey);
            delete answers.privateKey;
            return answers;
        });
    }
}
