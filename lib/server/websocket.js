const wsServer = require('ws');
const DB = require('../db');
const db = DB.instance('db/config', 'json');
const rpc = require('./rpc');
const StorageManager = require('../storage');

module.exports = function() {
    const settings = db.get('/settings');
    StorageManager.addPeer({
        address: settings.serverId,
        type: 'node',
        parents: [],
        ipAddress: settings.ipAddress,
        socket: null,
    });
    const rpcInstance = rpc.instance(settings);
    const wss = new wsServer.WebSocketServer({ port: 14400 });
    console.log('Connected to test net on port 14400');

    wss.on('connection', function connection(ws) {
        ws.on('message', handleMessage.bind(null, ws));
    });

    async function handleMessage(socket, message) {
        let id, data;
        try {
            data = JSON.parse(message);
            id = data._id;
            if(data._bid) {
                console.log('received broadcast', data);
                return;
            }

            if(!data.status) {
                if(data.params && data.params[0]) {
                    data.params[0].socket = socket;
                }
                const result = await rpcInstance.call(data.fn, data.params);
                const response = {
                    _id: data._id,
                    status: 'received',
                    fn: data.fn,
                    result,
                };
                socket.send(JSON.stringify(response));
            }
        } catch(e) {
            const response = {
                _id: id,
                status: 'error',
                fn: data.fn,
                error: e.toString(),
            };
            socket.send(JSON.stringify(response));
        }
    }
}