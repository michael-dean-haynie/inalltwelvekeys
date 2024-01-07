const MessageRepository = require('../repositories/message-repository.js')
const WebsocketConnectionsService = require('../services/websocket-connections-service')

// Initialize Services
const websocketConnectionsService = new WebsocketConnectionsService()

/**
 * Handler responsible for processing websocket events
 */
function websocketHandler(ws, request) {
    // console.log('ip:', request.socket.remoteAddress)
    // console.log('userAgent', request.headers['user-agent'])

    // register connection
    const connection = websocketConnectionsService.registerConnection({ websocket: ws})
    console.log(`Connection opened (${connection.id})`)

    ws.on('message', async function message(data) {
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

        // save to db
        const deserializedMsg = JSON.parse(dataAsString);
        const [byte1, byte2, byte3] = deserializedMsg.bytes
        await MessageRepository.create({
            byte1,
            byte2,
            byte3,
            timestamp: deserializedMsg.timestamp
        })
    })

    ws.on('error', (error) => {
        console.error(`Error with connection (${connection.id}): `, error)
    })

    ws.on('close', function close() {
        console.log(`Connection closed (${connection.id})`)
    })

}

module.exports = websocketHandler
