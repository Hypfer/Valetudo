const MiioTimeoutError = require("./MiioTimeoutError");

class RetryWrapperSurrenderError extends MiioTimeoutError {}

module.exports = RetryWrapperSurrenderError;
