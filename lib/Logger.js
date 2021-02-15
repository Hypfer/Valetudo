const fs = require("fs");
const util = require("util");

const LogFileOptions = Object.freeze({
    flags: "as"
});

let LogLevel = 0;
let LogFilename = "/dev/null";
let LogFile = fs.createWriteStream(LogFilename, LogFileOptions);

const LogLevels = Object.freeze({
    "trace": -2,
    "debug": -1,
    "info": 0,
    "warn": 1,
    "error": 2
});

const BuildPrefix = (LogLevel) => {
    let timestamp = new Date().toISOString();
    return "[" + timestamp + "] [" + LogLevel + "]";
};

class Logger {
    /**
     * @property {"trace"|"debug"|"info"|"warn"|"error"} LogLevel
     */
    static get LogLevel() {
        return Object.keys(LogLevels).find(key => LogLevels[key] === LogLevel);
    }
    static get LogLevels() {
        return LogLevels;
    }
    static set LogLevel(value) {
        if (LogLevels[value] === undefined) {
            throw "invalid log level '" + value + "', valid are '" + Object.keys(LogLevels).join("','") + "'";
        }
        LogLevel = LogLevels[value];
    }
    static set LogFile(filename) {
        if (LogFilename === filename) {
            return;
        }
        if (LogFile) {
            LogFile.close();
        }
        LogFilename = filename;
        LogFile = fs.createWriteStream(LogFilename, LogFileOptions);
    }
    static get LogFile() {
        return LogFilename;
    }

    static log(level, ...args) {
        if (LogLevel <= LogLevels[level]) {
            const logPrefix = BuildPrefix(level.toUpperCase());
            // eslint-disable-next-line no-console
            console.log(logPrefix, ...args);
            LogFile.write([logPrefix, ...args].map(arg => {
                if (typeof arg === "string") {
                    return arg;
                }
                return util.inspect(arg);
            }).join(" "));
            LogFile.write("\n");
        }
    }

    /**
     * @see console.trace
     * @param  {...any} args
     */
    static trace(...args) {
        Logger.log("trace", ...args);
    }

    /**
     * @see console.debug
     * @param  {...any} args
     */
    static debug(...args) {
        Logger.log("debug", ...args);
    }

    /**
     * @see console.info
     * @param  {...any} args
     */
    static info(...args) {
        Logger.log("info", ...args);
    }

    /**
     * @see console.warn
     * @param  {...any} args
     */
    static warn(...args) {
        Logger.log("warn", ...args);
    }

    /**
     * @see console.error
     * @param  {...any} args
     */
    static error( ...args) {
        Logger.log("error", ...args);
    }
}

module.exports = Logger;
