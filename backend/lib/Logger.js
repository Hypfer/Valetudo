const EventEmitter = require("events").EventEmitter;
const fs = require("fs");
const os = require("os");
const Tools = require("./utils/Tools");
const util = require("util");

class Logger {
    constructor() {
        this._logEventEmitter = new EventEmitter();
        this._logFileMaxSizeCheckLineCounter = 1;


        this.logFileMaxSize = 4 * 1024 * 1024; //4MiB
        this.logLevel = Logger.LogLevels["info"];

        this.logFilePath = os.type() === "Windows_NT" ? Logger.DEFAULT_LOGFILE_PATHS.WINNT : Logger.DEFAULT_LOGFILE_PATHS.POSIX;
        this.logFileWriteStream = fs.createWriteStream(this.logFilePath, Logger.LogFileOptions);
    }

    /**
     * @public
     * @return {string}
     */
    getLogLevel() {
        return Object.keys(Logger.LogLevels).find(key => {
            return Logger.LogLevels[key] === this.logLevel;
        });
    }

    /**
     * @public
     * @param {string} value
     */
    setLogLevel(value) {
        if (Logger.LogLevels[value] === undefined) {
            throw new Error(`Invalid log level '${value}', valid are '${Object.keys(Logger.LogLevels).join("','")}'`);
        } else {
            this.logLevel = Logger.LogLevels[value];
        }
    }

    /**
     * @public
     * @return {string}
     */
    getLogFilePath() {
        return this.logFilePath;
    }

    /**
     * @public
     * @param {string} filePath
     */
    setLogFilePath(filePath) {
        if (Tools.ARE_SAME_FILES(this.logFilePath, filePath)) {
            // We are already writing to that file
            return;
        }

        if (this.logFileWriteStream) {
            this.logFileWriteStream.close();
            this.logFileWriteStream = null;
        }

        this.logFilePath = filePath;
        // Check if output is already redirected to that same file. If
        // it is, we do not need to write to that same file, because that
        // would lead to duplicate log entries.
        // Setting the LogFilename anyway ensures that the UI Log still works.
        if (!Tools.ARE_SAME_FILES(filePath, "/proc/self/fd/1")) {
            this.logFileWriteStream = fs.createWriteStream(this.logFilePath, Logger.LogFileOptions);
        }

        this.log("info", "Set Logfile to " + filePath);
    }


    /**
     * @private
     * @param {string} logLevel
     * @return {string}
     */
    buildLogLinePrefix(logLevel) {
        return `[${new Date().toISOString()}] [${logLevel}]`;
    }

    /**
     * @param {string} level
     * @param {...any} args
     * @private
     */
    log(level, ...args) {
        if (this.logLevel["level"] <= Logger.LogLevels[level]["level"]) {
            const logLinePrefix = this.buildLogLinePrefix(level.toUpperCase());
            const logLine = [logLinePrefix, ...args].map(arg => {
                if (typeof arg === "string") {
                    return arg;
                }

                return util.inspect(
                    arg,
                    {
                        depth: Infinity
                    }
                );
            }).join(" ");

            Logger.LogLevels[level]["callback"](logLine);
            this.logLineToFile(logLine);
            this._logEventEmitter.emit("LogMessage", logLine);
        }
    }

    /**
     * @private
     * @param {string} line
     */
    logLineToFile(line) {
        if (this.logFileWriteStream) {
            /*
                As the default limit is rather large, we can avoid checking the logfile size on every single
                log line without running into any OOM issues
             */
            this._logFileMaxSizeCheckLineCounter = (this._logFileMaxSizeCheckLineCounter + 1) % 100;

            if (this._logFileMaxSizeCheckLineCounter === 0) {
                if (
                    this.logFilePath !== Logger.DEFAULT_LOGFILE_PATHS.WINNT &&
                    this.logFilePath !== Logger.DEFAULT_LOGFILE_PATHS.POSIX
                ) {
                    let fileSize = 0;

                    try {
                        const stat = fs.statSync(this.logFilePath);

                        fileSize = stat.size;
                    } catch (e) {
                        this.error("Error while checking Logfile size:", e);
                    }

                    if (fileSize > this.logFileMaxSize) {
                        this.logFileWriteStream.close();
                        fs.writeFileSync(this.logFilePath, "");
                        this.logFileWriteStream = fs.createWriteStream(this.logFilePath, Logger.LogFileOptions);

                        this.warn(`Logfile ${this.logFilePath} was cleared after reaching a size of ${fileSize} bytes.`);
                    }
                }
            }


            this.logFileWriteStream.write(line);
            this.logFileWriteStream.write("\n");
        }
    }

    /**
     * @public
     * @param {any} listener
     */
    onLogMessage(listener) {
        this._logEventEmitter.on("LogMessage", listener);
    }

    /**
     * @public
     * @see console.trace
     * @param  {...any} args
     */
    trace(...args) {
        this.log("trace", ...args);
    }

    /**
     * @public
     * @see console.debug
     * @param  {...any} args
     */
    debug(...args) {
        this.log("debug", ...args);
    }

    /**
     * @public
     * @see console.info
     * @param  {...any} args
     */
    info(...args) {
        this.log("info", ...args);
    }

    /**
     * @public
     * @see console.warn
     * @param  {...any} args
     */
    warn(...args) {
        this.log("warn", ...args);
    }

    /**
     * @public
     * @see console.error
     * @param  {...any} args
     */
    error( ...args) {
        this.log("error", ...args);
    }

    /**
     * @public
     */
    getProperties() {
        return {
            EVENTS: Logger.EVENTS,
            LogLevels: Logger.LogLevels
        };
    }
}

Logger.EVENTS = {
    LogMessage: "LogMessage",
};

Logger.LogLevels = Object.freeze({
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

Logger.LogFileOptions = Object.freeze({
    flags: "as"
});

Logger.DEFAULT_LOGFILE_PATHS = Object.freeze({
    POSIX: "/dev/null",
    WINNT: "\\\\.\\NUL"
});


module.exports = new Logger();
