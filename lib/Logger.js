let LogLevel = 0;

const LogLevels = Object.freeze({
    "trace": -2,
    "debug": -1,
    "info": 0,
    "warn": 1,
    "error": 2
});

const BuildPrefix = (LogLevel) => {
    let timestamp = new Date().toISOString();
    return "[" + timestamp + "] [" + LogLevel + "] ";
};

class Logger {
    /**
     * @property {"trace"|"debug"|"info"|"warn"|"error"} LogLevel
     */
    static get LogLevel() {
        return Object.keys(LogLevels).find(key => LogLevels[key] === LogLevel);
    }
    static set LogLevel(value) {
        if (LogLevels[value] === undefined) {
            throw "invalid log level '" + value + "', valid are '" + Object.keys(LogLevels).join("','") + "'";
        }
        LogLevel = LogLevels[value];
    }

    /**
     * @see console.trace
     * @param {string} message
     * @param  {...any} args
     */
    static trace(message, ...args) {
        if (LogLevel <= LogLevels.trace) {
            // eslint-disable-next-line no-console
            console.debug(BuildPrefix("TRACE") + message, ...args);
        }
    }

    /**
     * @see console.debug
     * @param {string} message
     * @param  {...any} args
     */
    static debug(message, ...args) {
        if (LogLevel <= LogLevels.debug) {
            // eslint-disable-next-line no-console
            console.debug(BuildPrefix("DEBUG") + message, ...args);
        }
    }

    /**
     * @see console.info
     * @param {string} message
     * @param  {...any} args
     */
    static info(message, ...args) {
        if (LogLevel <= LogLevels.info) {
            // eslint-disable-next-line no-console
            console.info(BuildPrefix("INFO") + message, ...args);
        }
    }

    /**
     * @see console.warn
     * @param {string} message
     * @param  {...any} args
     */
    static warn(message, ...args) {
        if (LogLevel <= LogLevels.warn) {
            // eslint-disable-next-line no-console
            console.warn(BuildPrefix("WARN") + message, ...args);
        }
    }

    /**
     * @see console.error
     * @param {string} message
     * @param  {...any} args
     */
    static error(message, ...args) {
        if (LogLevel <= LogLevels.error) {
            // eslint-disable-next-line no-console
            console.error(BuildPrefix("ERROR") + message, ...args);
        }
    }
}

module.exports = Logger;
