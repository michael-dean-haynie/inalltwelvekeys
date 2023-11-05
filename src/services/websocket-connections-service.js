const { v4: uuidv4 } = require('uuid');

module.exports = class WebsocketConnectionsService {
    connections = [];

    constructor() {}

    registerConnection({ websocket }) {
        const connection = {
            id: uuidv4(),
            websocket
        }
        this.connections.push(connection)
        return connection
    }
}
