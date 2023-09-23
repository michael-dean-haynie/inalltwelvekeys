const { createServer } = require('https')
const http = require('http')
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
if (process.env.HTTPS_PORT === undefined) {
    throw new Error("Missing PORT environment variable.")
}

// create https server
const serverOptions = {
    cert: readFileSync(process.env.TLS_CERT),
    key: readFileSync(process.env.TLS_CERT_KEY)
}
if (process.env.TLS_CA_BUNDLE !== undefined) {
    serverOptions.ca = readFileSync(process.env.TLS_CA_BUNDLE)
}
const server = createServer(serverOptions, (req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
});

// create web socket server (on top of https server)
const wss = new WebSocketServer({ server });
wss.on('listening', () => {
    console.log(`wss server listening on port ${process.env.HTTPS_PORT} ...`)
})
wss.on('connection', function connection(ws) {
    ws.on('error', console.error)

    ws.on('message', function message(data) {
        console.log('received: %s', data)
    });

    ws.send('something')
});

// start https server
server.listen(process.env.HTTPS_PORT, () => {
    console.log(`https server listening on port ${process.env.HTTPS_PORT} ...`)
})

// create/start http server
http.createServer((req, res) => {
    const tgt = new URL(req.url, `https://${req.headers.host}`).toString()
        .replace('http:', 'https:')
        .replace(process.env.HTTP_PORT, process.env.HTTPS_PORT)
    console.log('redirecting to: ', tgt)
    res.writeHead(302, {'Location': tgt})
    res.end();
}).listen(process.env.HTTP_PORT, () => {
    console.log(`http server listening on port ${process.env.HTTP_PORT} ...`)
})
