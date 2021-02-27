const {EventEmitter} = require("events");
const fs = require("fs");
const util = require("util");
const Tools = require("./Tools");

const LogFileOptions = Object.freeze({
    flags: "as"
});

const LogLevels = Object.freeze({
    // eslint-disable-next-line no-console
    "trace": {"level": -2, "callback": console.debug},
    // eslint-disable-next-line no-console
    "debug": {"level": -1, "callback": console.debug},
    // eslint-disable-next-line no-console
    "info": {"level": 0, "callback": console.info},
    // eslint-disable-next-line no-console
    "warn": {"level": 1, "callback": console.warn},
    // eslint-disable-next-line no-console
    "error": {"level": 2, "callback": console.error},
});

let LogLevel = LogLevels["info"];
let LogFilename = "/dev/null";
let LogFile = fs.createWriteStream(LogFilename, LogFileOptions);
let LogEventEmitter = new EventEmitter();


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
        if (Tools.ARE_SAME_FILES(LogFilename, filename)) {
            // We are already writing to that file
            return;
        }

        if (LogFile) {
            LogFile.close();
            LogFile = null;
        }
        LogFilename = filename;
        // Check if output is already redirected to that same file. If
        // it is, we do not need to write to that same file, because that
        // would lead to duplicate log entries.
        // Setting the LogFilename anyway ensures that the UI Log still works.
        if (!Tools.ARE_SAME_FILES(filename, "/proc/self/fd/1")) {
            LogFilename = filename;
            LogFile = fs.createWriteStream(LogFilename, LogFileOptions);
        }

        Logger.log("info", "Set Logfile to " + filename);
    }
    static get LogFile() {
        return LogFilename;
    }

    static onLogMessage(listener) {
        LogEventEmitter.on("LogMessage", listener);
    }

    static log(level, ...args) {
        if (LogLevel["level"] <= LogLevels[level]["level"]) {
            const logPrefix = BuildPrefix(level.toUpperCase());
            LogLevels[level]["callback"](logPrefix, ...args);
            const logLine = [logPrefix, ...args].map(arg => {
                if (typeof arg === "string") {
                    return arg;
                }
                return util.inspect(arg);
            }).join(" ");
            if (LogFile) {
                LogFile.write(logLine);
                LogFile.write("\n");
            }
            LogEventEmitter.emit("LogMessage", logLine);
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
