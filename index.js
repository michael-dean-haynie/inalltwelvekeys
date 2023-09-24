const { createServer } = require('https')
const http = require('http')
const fs  = require('fs')
const { WebSocketServer } = require('ws')
const dotenv = require('dotenv')
const path = require('path')

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
    cert: fs.readFileSync(process.env.TLS_CERT),
    key: fs.readFileSync(process.env.TLS_CERT_KEY)
}
if (process.env.TLS_CA_BUNDLE !== undefined) {
    serverOptions.ca = fs.readFileSync(process.env.TLS_CA_BUNDLE)
}
const server = createServer(serverOptions, (req, res) => {
    // Handle browser-config.js
    if (req.url === '/browser-config.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(`window.config = {
            hostname: '${process.env.HOSTNAME}:${process.env.HTTPS_PORT}'
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
});

// create web socket server (on top of https server)
const connections = []

const wss = new WebSocketServer({ server });
wss.on('listening', () => {
    console.log(`wss server listening on port ${process.env.HTTPS_PORT} ...`)
})
wss.on('connection', function connection(ws) {
    connections.push(ws)
    ws.on('error', console.error)

    ws.on('message', function message(data) {
        let dataAsString
        if (typeof data === 'string') {
            // Data is already a string, no need to convert
            console.log('Received message as string:', data);
            dataAsString = data
        } else if (data instanceof Buffer) {
            // Convert the binary data to a string using UTF-8 encoding
            const messageString = data.toString('utf8');
            console.log('Received message as binary:', messageString);
            dataAsString = messageString
        } else {
            // Handle other data types if necessary
            console.error('Received unsupported data type:', typeof data);
        }
        console.log(`received: ${dataAsString}`)
        connections.forEach(connection => connection.send(dataAsString))
    });
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
