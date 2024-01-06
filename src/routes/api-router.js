const Router = require('router')

const statusHandler = require('../handlers/api/status-handler.js')

const apiRouter = Router()
apiRouter.get('/status', statusHandler)

module.exports = apiRouter
