class MiioDummycloudNotConnectedError extends Error {
    /** @param {object} msg The request message that was not responded to. */
    constructor(msg) {
        super("Dummycloud not connected. Failed to send message:" + JSON.stringify(msg));
        this.name = "MiioDummycloudNotConnectedError";
    }
}

module.exports = MiioDummycloudNotConnectedError;
