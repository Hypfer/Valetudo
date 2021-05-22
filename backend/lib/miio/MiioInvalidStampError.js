class MiioInvalidStampError extends Error {
    constructor() {
        super("Invalid MiioSocket stamp");
        this.name = "MiioInvalidStampError";
    }
}

module.exports = MiioInvalidStampError;
