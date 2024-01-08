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
    res.end(JSON.stringify(pageResult))
}

/**
 * Handler responsible for processing GET requests for a list of message segments within a time window
 */
async function getSegments(req, res) {
    const queryData = url.parse(req.url, true).query;

    if (
        !validator.isISO8601(queryData.start || '') ||
        !validator.isISO8601(queryData.end || '')
    ) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'text/plain')
        res.end(`query params 'start' and 'end' must both be ISO8601 dates`)
    }

    const startMs = new Date(queryData.start).getTime()
    const endMs = new Date(queryData.end).getTime()
    const gapSizeMs = 10000 // gap size set to 10000 ms (10 seconds)
    const result = await MessageRepository.readSegments(startMs, endMs, gapSizeMs)

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
}

/**
 * Handler responsible for processing GET requests for a list of messages in a segment
 */
async function getSegment(req, res) {
    const queryData = url.parse(req.url, true).query;

    if (
        !validator.isInt(queryData.start || '') ||
        !validator.isInt(queryData.end || '')
    ) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'text/plain')
        res.end(`query params 'start' and 'end' must both be numbers`)
    }

    const startMs = Number(queryData.start)
    const endMs = Number(queryData.end)
    const result = await MessageRepository.readSegment(startMs, endMs)

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
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
    getSegments,
    getSegment,
    del
}
