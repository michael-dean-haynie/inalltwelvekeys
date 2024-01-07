const url = require('url')
const validator = require('validator');

const MessageRepository = require('../../repositories/message-repository.js')

/**
 * Handler responsible for processing GET requests
 */
async function get(req, res) {
    const queryData = url.parse(req.url, true).query;
    const page = validator.isInt(queryData.page || '') ? Number(queryData.page) : 0
    const pageSize = validator.isInt(queryData.pageSize || '') ? Number(queryData.pageSize) : 100

    const pageResult = await MessageRepository.readPaginated(page, pageSize)

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(pageResult.results))
}

module.exports = {
    get
}
