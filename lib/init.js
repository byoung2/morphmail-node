const shell = require('./util/shell');
const DB = require('./db');
const ip = require('./util/ipAddress');
const server = require('./server/websocket');

module.exports = async function() {
    console.clear();
    console.log('Welcome to MorphMail\n\n');
    let settings;
    const db = DB.instance('db/config', 'json');
    try {
        settings = db.get('/settings');
    } catch(e) {
        const ipAddress = await ip.externalIp().catch(() => '127.0.0.1');
        settings = await shell.init(ipAddress);
        db.add('/settings', settings);
        console.log(settings);
    }
    
    server();
}