const { createServer } = require('https')
const http = require('http')
const fs  = require('fs')
const { WebSocketServer } = require('ws')
const dotenv = require('dotenv')
const Knex = require('knex');
const knexConfig = require('./knexfile');
const { Model } = require('objection');

const setupRouter = require('./src/routes/router.js')
const websocketHandler = require('./src/handlers/websocket-handler.js')

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

// Initialize knex
const knex = Knex(knexConfig.development);
Model.knex(knex)

let serverOptions = {
    cert: fs.readFileSync(process.env.TLS_CERT),
    key: fs.readFileSync(process.env.TLS_CERT_KEY)
}
if (process.env.TLS_CA_BUNDLE !== undefined) {
    serverOptions.ca = fs.readFileSync(process.env.TLS_CA_BUNDLE)
}

if (process.env.ENV === 'dev') {
    console.log('emptying serverOptions')
    serverOptions = {}
}

// create https server
const server = createServer(serverOptions, (req, res) => {
    // open up cors
    console.log('allowing cors https')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-ax-Age', 2592000); // 30 days

    setupRouter(req, res)
});

const wss = new WebSocketServer({ server });
wss.on('listening', () => {
    console.log(`wss server listening on port ${process.env.HTTPS_PORT} ...`)
})
wss.on('connection', function connection(ws, request) {
    websocketHandler(ws, request)
});

// start https server
server.listen(process.env.HTTPS_PORT, () => {
    console.log(`https server listening on port ${process.env.HTTPS_PORT} ...`)
})

// create/start http server
http.createServer((req, res) => {
    // open up cors
    console.log('allowing cors http')
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-ax-Age', 2592000); // 30 days

    if (process.env.ENV === 'dev'){
        setupRouter(req, res)
    } else {
        const tgt = new URL(req.url, `https://${req.headers.host}`).toString()
            .replace('http:', 'https:')
            .replace(process.env.HTTP_PORT, process.env.HTTPS_PORT)
        console.log('redirecting to: ', tgt)
        res.writeHead(302, {'Location': tgt})
        res.end();
    }
}).listen(process.env.HTTP_PORT, () => {
    console.log(`http server listening on port ${process.env.HTTP_PORT} ...`)
})
