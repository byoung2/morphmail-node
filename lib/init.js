const shell = require('./util/shell');

module.exports = async function() {
    console.clear();
    const ipAddress = '127.0.0.1';
    settings = await shell.init(ipAddress);
    console.log(settings);
}