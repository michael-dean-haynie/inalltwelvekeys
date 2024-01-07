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

    static async readPaginated(page, pageSize) {
        const result = await Message.query()
            .page(page, pageSize)

        // console.log(result.results.length); // --> 100
        // console.log(result.total); // --> 3341
        return result;
    }

    static async delete(id) {
        const numberOfDeletedRows = await Message.query().deleteById(id)
    }

    static async deleteAll() {
        await Message.query().truncate()
    }
}

module.exports = MessageRepository
