const path = require('path')
const fs  = require('fs')

/**
 * Handler responsible for processing requests for the angular ui (e.g. index.html, *.js, *.css ...etc)
 * Might also influence the websocket connection upgrade flow, not sure.
 */
module.exports = function (req, res) {
    const angularIndex = path.join(process.cwd(), 'inalltwelvekeys-ui', 'index.html')
    let angularExists = false
    try {
        fs.accessSync(angularIndex, fs.constants.F_OK | fs.constants.R_OK);
        angularExists = true;
    } catch (err) {
        angularExists = false;
    }

    if (angularExists) {
        serveAngular(req, res)
    } else {
        serveDefault(req, res)
    }
}

/**
 * Responsible for serving non-angluar webpage if angular assets are not found.
 */
function serveDefault(req, res) {
    // Handle browser-config.js
    if (req.url === '/browser-config.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(`window.config = {
            hostname: '${process.env.CLIENT_HOSTNAME}:${process.env.HTTPS_PORT}'
        }`);
    }

    // Get the requested file path
    if (req.url === '/') {
        req.url = '/index.html'
    }
    const filePath = path.join(process.cwd(), req.url);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, return a 404 response
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            // Determine the content type based on the file extension
            const extname = path.extname(filePath);
            const contentType = getContentType(extname);

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
}

/**
 * Responsible for serving angular ui assets.
 */
function serveAngular(req, res) {
    const reqIsPathOnly = !req.url.includes('.')
    if (reqIsPathOnly) {
        req.url = '/index.html'
    }

    // Get the requested file path
    if (req.url === '/') {
        req.url = '/index.html'
    }
    const filePath = path.join(process.cwd(), 'inalltwelvekeys-ui',  req.url);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, return a 404 response
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            // Determine the content type based on the file extension
            const extname = path.extname(filePath);
            const contentType = getContentType(extname);

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
}

/**
 * Function to determine content type based on file extension
 * @param extname the name of the extension (e.g. '.html' or '.css')
 * @returns {string}
 */
function getContentType(extname) {
    switch (extname) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        default:
            return 'application/octet-stream';
    }
}
