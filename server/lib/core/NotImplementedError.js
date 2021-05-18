class NotImplementedError extends Error {
    constructor(message = "not implemented") {
        super(message);
        this.name = "NotImplementedError";
    }
}

module.exports = NotImplementedError;
