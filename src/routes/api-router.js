const Router = require('router')

const statusHandler = require('../handlers/api/status-handler.js')
const exploreHandler = require('../handlers/api/explore-handler.js')

const apiRouter = Router()

apiRouter.get('/status', statusHandler)

apiRouter.get('/explore', exploreHandler)

module.exports = apiRouter
