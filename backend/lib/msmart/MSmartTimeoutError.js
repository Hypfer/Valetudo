class MSmartTimeoutError extends Error {
    /**
     * @param {object} context
     * @param {string} context.nonce
     * @param {string} context.command
     */
    constructor(context) {
        super(`Request with nonce ${context.nonce} timed out`);

        this.name = "MSmartTimeoutError";
        this.nonce = context.nonce;
        this.command = context.command;
    }
}

module.exports = MSmartTimeoutError;
