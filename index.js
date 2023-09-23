const { createServer } = require('https')
const { readFileSync } = require('fs')
const { WebSocketServer } = require('ws')
const dotenv = require('dotenv')

// configure / validate environment variables
dotenv.config()
if (process.env.TLS_CERT === undefined) {
    throw new Error("Missing TLS_CERT environment variable.")
}
if (process.env.TLS_CERT_KEY === undefined) {
    throw new Error("Missing TLS_CERT_KEY environment variable.")
}
if (process.env.PORT === undefined) {
    throw new Error("Missing PORT environment variable.")
}

// create https server
const serverOptions = {
    cert: readFileSync(process.env.TLS_CERT),
    key: readFileSync(process.env.TLS_CERT_KEY)
}
const server = createServer(serverOptions, (req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
});

// create web socket server (on top of https server)
const wss = new WebSocketServer({ server });
wss.on('listening', () => {
    console.log(`wss server listening on port ${process.env.PORT} ...`)
})
wss.on('connection', function connection(ws) {
    ws.on('error', console.error)

    ws.on('message', function message(data) {
        console.log('received: %s', data)
    });

    ws.send('something')
});

// start http server
server.listen(process.env.PORT, () => {
    console.log(`https server listening on port ${process.env.PORT} ...`)
})
