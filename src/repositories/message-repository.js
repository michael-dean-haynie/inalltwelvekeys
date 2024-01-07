const { Message } = require('../models/message')

/**
 * Handles CRUD operations for Message data
 * @type {MessageRepository}
 */
class MessageRepository {

    static async create({byte1, byte2, byte3, timestamp}) {
        await Message.query().insert({
            byte1,
            byte2,
            byte3,
            timestamp
        })
    }
}

module.exports = MessageRepository
