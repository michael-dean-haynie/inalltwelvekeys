const Router = require('router')

const statusHandler = require('../handlers/api/status-handler.js')
const messageHandlers = require('../handlers/api/message-handlers.js')
const exploreHandler = require('../handlers/api/explore-handler.js')

const apiRouter = Router()

apiRouter.get('/status', statusHandler)

apiRouter.get('/message', messageHandlers.get)
apiRouter.get('/message/segments', messageHandlers.getSegments)
apiRouter.get('/message/segment', messageHandlers.getSegment)
apiRouter.delete('/message/:id', messageHandlers.del)

apiRouter.get('/explore', exploreHandler)

module.exports = apiRouter
