const shell = require('./util/shell');
const DB = require('./db');
const cron = require('./cron');

module.exports = async function() {
    console.clear();
    console.log('Welcome to MorphMail\n\n');
    let settings;
    const db = DB.instance('db/config', 'json');
    try {
        settings = db.get('/settings');
    } catch(e) {
        const ip = require('./util/ipAddress');
        const ipAddress = await ip.externalIp().catch(() => '127.0.0.1');
        settings = await shell.init(ipAddress);
        db.add('/settings', settings);
    }
    const graphDb = DB.instance('db/graph', 'json');
    const server = require('./server/websocket');
    const smtp = require('./server/smtp');
    const graph = require('./cryptocurrency/graph');
    try {
        graphDb.get(`/${ settings.nodeType }`);
    } catch(e) {
        graphDb.add(`/${ settings.nodeType }`, graph.getGenesis());
    }
    
    server();
    console.log(settings);
    if(settings.externalMail === 'yes') {
        smtp();
    }
    cron();
}