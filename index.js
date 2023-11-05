const { createServer } = require('https')
const http = require('http')
const fs  = require('fs')
const { WebSocketServer } = require('ws')
const dotenv = require('dotenv')
const path = require('path')
const WebsocketConnectionsService = require('./src/services/websocket-connections-service')

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
    const angularIndex = path.join(__dirname, 'inalltwelvekeys-ui', 'index.html')
    let angularExists = false
    try {
        fs.accessSync(angularIndex, fs.constants.F_OK | fs.constants.R_OK);
        angularExists = true;
    } catch (err) {
        angularExists = false;
    }

    if (angularExists) {
        serveAngular(req, res)
    } else {
       serveDefault(req, res)
    }

});

// create web socket server (on top of https server)
const connections = []

const wss = new WebSocketServer({ server });
wss.on('listening', () => {
    console.log(`wss server listening on port ${process.env.HTTPS_PORT} ...`)
})
wss.on('connection', function connection(ws, request) {
    // console.log('ip:', request.socket.remoteAddress)
    // console.log('userAgent', request.headers['user-agent'])

    // register connection
    const connection = websocketConnectionsService.registerConnection(ws)
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

function serveDefault(req, res) {
    // Handle browser-config.js
    if (req.url === '/browser-config.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(`window.config = {
            hostname: '${process.env.CLIENT_HOSTNAME}:${process.env.HTTPS_PORT}'
        }`);
    }

    // Get the requested file path
    if (req.url === '/') {
        req.url = '/index.html'
    }
    const filePath = path.join(__dirname, req.url);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, return a 404 response
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            // Determine the content type based on the file extension
            const extname = path.extname(filePath);
            const contentType = getContentType(extname);

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
}

function serveAngular(req, res) {
    const reqIsPathOnly = !req.url.includes('.')
    if (reqIsPathOnly) {
        req.url = '/index.html'
    }

    // Get the requested file path
    if (req.url === '/') {
        req.url = '/index.html'
    }
    const filePath = path.join(__dirname, 'inalltwelvekeys-ui',  req.url);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, return a 404 response
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            // Determine the content type based on the file extension
            const extname = path.extname(filePath);
            const contentType = getContentType(extname);

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
}
// Function to determine content type based on file extension
function getContentType(extname) {
    switch (extname) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        default:
            return 'application/octet-stream';
    }
}
