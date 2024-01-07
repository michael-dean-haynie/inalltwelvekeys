const Router = require('router')
const finalhandler = require('finalhandler')

const uiHandler = require('../handlers/ui-handler.js')
const apiRouter = require('./api-router.js')

const router = Router()

router.use('/api/', apiRouter)

// this wild card seems to catch things that don't match the routes above
// this works nicely for matching .js, .css, .html ...etc from the angular ui
router.route('/*').all(uiHandler)


/**
 * Sets up router. Intended to be called inside the main handler passed to the createServer lib.
 * @example
 * <pre>
 * const server = createServer(serverOptions, (req, res) => {
 *    setupRouter(req, res)
 * });
 * </pre>
 *
 * @param req
 * @param res
 */
module.exports = function (req, res) {
    router(req, res, finalhandler(req, res))
}
