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

/**
 * Handler responsible for processing DELETE requests
 */
async function del(req, res, next) {
    const { id } = req.params

    if (id === undefined) {
        console.error(`request param ':id' was undefined`);
    }

    if (id === 'truncate') {
        await MessageRepository.deleteAll()
    }

    if (validator.isInt(id)) {
        await MessageRepository.delete(Number(id))
    }

    res.statusCode = 204
    res.end()
}

module.exports = {
    get,
    del
}
