const url = require('url')
const { Message } = require('../../models/message')
const MessageRepository = require('../../repositories/message-repository.js')

// example json from websocket:
// {"type": "control_change", "time": 0, "control": 64, "value": 0, "channel": 2, "bytes": [178, 64, 0]}


/**
 * Simple handler that just returns a happy status message.
 */
module.exports = async function (req, res) {
    const queryData = url.parse(req.url, true).query;
    const startingJsonBytes = [
        Number(queryData.b1),
        Number(queryData.b2),
        Number(queryData.b3)
    ]
    console.log('startingJsonBytes', startingJsonBytes)
    const uint32 = convertMidiJsonBytesToUint32(startingJsonBytes);
    console.log('uint32', uint32)
    const finalJsonBytes = convertUint32ToMidiJsonBytes(uint32)
    console.log('finalJsonBytes', finalJsonBytes)

    await MessageRepository.create({
        byte1: Number(queryData.b1),
        byte2: Number(queryData.b2),
        byte3: Number(queryData.b3),
        timestamp: Date.now()
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(finalJsonBytes))
    // res.setHeader('Content-Type', 'text/plain')
    // res.end('this is a response message')
}

function convertMidiJsonBytesToUint32(bytes) {
    const uint8Array = new Uint8Array([...[0], ...bytes])
    const dataView = new DataView(uint8Array.buffer)
    const uint32 = dataView.getUint32()
    return uint32
}

function convertUint32ToMidiJsonBytes(uint32) {
    const buffer = new ArrayBuffer(4) // 4 bytes for a 32-bit integer
    const dataView = new DataView(buffer)
    const uint8Array = new Uint8Array(buffer)

    dataView.setUint32(0, uint32)

    const byteArray = Array.from(uint8Array)
    return byteArray.slice(1)
}
