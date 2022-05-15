const SMTPServer = require('smtp-server').SMTPServer;

module.exports = function() {
    const server = new SMTPServer({
        secure: false,
        authOptional: true,
        banner: 'cpe-104-34-67-45.socal.res.rr.com',
        onData: (stream, session, callback) => {
            console.log('data received')
            stream.pipe(process.stdout);
            stream.on('end', callback);
        },
        onAuth: (auth, session, callback) => {
            callback(null, { user: true });
        },
        onConnect: (session, callback) => {
            return callback();
        },
        onMailFrom: (address, session, callback) => {
            if (!address.address.match(/morphmail\.me/gi)) {
                return callback(
                    new Error("Only Morphmail addresses are allowed to send mail")
                );
            }
            return callback();
        }
    });

    server.on("error", err => {
        console.log("Error %s", err.message);
    });

    server.listen(25);
    console.log('Listening to SMTP on port 25');
}