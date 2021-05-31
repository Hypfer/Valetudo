class MiioTimeoutError extends Error {
    /** @param {object} msg The request message that was not responded to. */
    constructor(msg) {
        super("request timed out:" + JSON.stringify(msg));
        this.name = "MiioTimeoutError";
    }
}

module.exports = MiioTimeoutError;
