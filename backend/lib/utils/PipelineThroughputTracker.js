const { Transform } = require("stream");

class PipelineThroughputTracker extends Transform {
    /**
     * @param {(number) => void} reportCallback 
     */
    constructor(reportCallback) {
        super();

        this.totalBytes = 0;
        this.reportCallback = reportCallback;
    }

    _transform(chunk, encoding, callback) {
        this.totalBytes += chunk.length;
        this.reportCallback(this.totalBytes);

        callback(null, chunk);
    }

    _flush(callback) {
        this.reportCallback(this.totalBytes);

        callback();
    }
}

module.exports = PipelineThroughputTracker;
