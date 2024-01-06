const { createServer } = require('https')
const http = require('http')
const fs  = require('fs')
const { WebSocketServer } = require('ws')
const dotenv = require('dotenv')

const WebsocketConnectionsService = require('./src/services/websocket-connections-service')
const setupRouter = require('./src/routes/router.js')

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

// Initialize Services
const websocketConnectionsService = new WebsocketConnectionsService()

// create https server
const serverOptions = {
    cert: fs.readFileSync(process.env.TLS_CERT),
    key: fs.readFileSync(process.env.TLS_CERT_KEY)
}
if (process.env.TLS_CA_BUNDLE !== undefined) {
    serverOptions.ca = fs.readFileSync(process.env.TLS_CA_BUNDLE)
}

const server = createServer(serverOptions, (req, res) => {
    setupRouter(req, res)
});

const wss = new WebSocketServer({ server });
wss.on('listening', () => {
    console.log(`wss server listening on port ${process.env.HTTPS_PORT} ...`)
})
wss.on('connection', function connection(ws, request) {
    // console.log('ip:', request.socket.remoteAddress)
    // console.log('userAgent', request.headers['user-agent'])

    // register connection
    const connection = websocketConnectionsService.registerConnection({ websocket: ws})
    console.log(`Connection opened (${connection.id})`)

    ws.on('message', function message(data) {
        let dataAsString
        if (typeof data === 'string') {
            // Data is already a string, no need to convert
            // console.log('Received message as string:', data);
            dataAsString = data
        } else if (data instanceof Buffer) {
            // Convert the binary data to a string using UTF-8 encoding
            const messageString = data.toString('utf8');
            // console.log('Received message as binary:', messageString);
            dataAsString = messageString
        } else {
            // Handle other data types if necessary
            console.error('Received unsupported data type:', typeof data)
        }
        console.log(`Connection received message (${connection.id}): ${dataAsString}`)

        // broadcast to all other connections
        const otherConnections = websocketConnectionsService.connections.filter(conn => conn.id !== connection.id)
        for (let otherConnection of otherConnections) {
            otherConnection.websocket.send(dataAsString)
        }
    })

    ws.on('error', (error) => {
        console.error(`Error with connection (${connection.id}): `, error)
    })

    ws.on('close', function close() {
        console.log(`Connection closed (${connection.id})`)
    })

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
