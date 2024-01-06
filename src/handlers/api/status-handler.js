/**
 * Simple handler that just returns a happy status message.
 */
module.exports = function (req, res) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('vedi nice!!!')
}
