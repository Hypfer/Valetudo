class MiioErrorResponseError extends Error {
    constructor(msg, response) {
        super(msg);

        this.name = "MiioErrorResponseError";
        this.response = response;
    }
}

module.exports = MiioErrorResponseError;
