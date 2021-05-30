const stream = require("stream");

class BufferWriteStream extends stream.Writable {
    constructor() {
        super();

        this.chunks = [];
    }

    _write(chunk, encoding, done) {
        this.chunks.push(chunk);
        done();
    }

    getBuffer() {
        return Buffer.concat(this.chunks);
    }
}

module.exports = BufferWriteStream;
