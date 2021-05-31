const BufferWriteStream = require("./BufferWriteStream");
const stream = require("stream");
const zlib = require("zlib");
const {JsonStream} = require("jetsons");

function stringifyAndCompress(data, algorithm) {
    return new Promise((resolve, reject) => {
        const bufferStream = new BufferWriteStream();

        stream.pipeline(
            new JsonStream(data),
            algorithm,
            bufferStream,

            (err) => {
                if (err !== null && err !== undefined) {
                    reject(err);
                } else {
                    resolve(bufferStream.getBuffer());
                }
            }
        );
    });
}

function stringifyAndDeflate(data) {
    return stringifyAndCompress(data, zlib.createDeflate());
}

function stringifyAndGZip(data) {
    return stringifyAndCompress(data, zlib.createGzip());
}

module.exports = {
    stringifyAndDeflate: stringifyAndDeflate,
    stringifyAndGZip: stringifyAndGZip
};
