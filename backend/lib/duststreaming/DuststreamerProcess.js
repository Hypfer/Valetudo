const child_process = require("child_process");

const Logger = require("../Logger");


class DuststreamerProcess {
    /**
     * @param {object} options
     * @param {string} options.binaryPath
     * @param {string[]} options.args
     * @param {() => void} options.onPlaying
     * @param {(message: string) => void} options.onPipelineError
     * @param {() => void} options.onGone
     */
    constructor(options) {
        this.onPlaying = options.onPlaying;
        this.onPipelineError = options.onPipelineError;
        this.onGone = options.onGone;

        this.processGoneHandled = false;
        this.killRequested = false;
        this.forceKillTimeout = null;

        this.child = null;

        try {
            this.child = child_process.spawn(options.binaryPath, options.args, {
                stdio: ["ignore", "pipe", "pipe"]
            });
        } catch (err) {
            Logger.warn("Could not spawn duststreamer:", err.code ?? err.message);

            queueMicrotask(() => this.handleProcessGone());
        }

        if (!this.child) {
            return;
        }

        let stdoutBuf = "";
        if (this.child.stdout) {
            this.child.stdout.on("data", (chunk) => {
                stdoutBuf += chunk.toString();
                let nl;
                while ((nl = stdoutBuf.indexOf("\n")) >= 0) {
                    const line = stdoutBuf.slice(0, nl).trim();
                    stdoutBuf = stdoutBuf.slice(nl + 1);
                    if (line) {
                        this.handleStdoutLine(line);
                    }
                }
            });
        }

        if (this.child.stderr) {
            this.child.stderr.on("data", (chunk) => {
                const trimmed = chunk.toString().trim();
                if (trimmed) {
                    Logger.debug("duststreamer stdout:", trimmed);
                }
            });
        }

        this.child.once("error", (err) => {
            Logger.warn("Could not spawn duststreamer:", err);

            this.handleProcessGone();
        });

        this.child.once("exit", (code, signal) => {
            if (!this.killRequested && code !== 0) {
                Logger.debug(`duststreamer exited unexpectedly with code ${code} and signal ${signal}`);
            }

            this.handleProcessGone();
        });
    }

    /**
     * @private
     * @param {string} line
     */
    handleStdoutLine(line) {
        if (line === "PLAYING") {
            this.onPlaying();
        } else if (line.startsWith("ERROR:")) {
            this.onPipelineError(line.slice("ERROR:".length).trim());
        }
    }

    /**
     * @private
     */
    handleProcessGone() {
        if (this.processGoneHandled) {
            return;
        }

        this.processGoneHandled = true;

        if (this.forceKillTimeout) {
            clearTimeout(this.forceKillTimeout);

            this.forceKillTimeout = null;
        }

        this.onGone();
    }

    /**
     * @public
     */
    isAlive() {
        if (!this.child) {
            return false;
        }

        return !this.processGoneHandled && this.child.exitCode === null && this.child.signalCode === null;
    }

    /**
     * @public
     * @returns {boolean}
     */
    kill() {
        if (this.killRequested || !this.child) {
            return false;
        }

        this.killRequested = true;

        this.child.kill("SIGTERM");

        this.forceKillTimeout = setTimeout(() => {
            if (!this.processGoneHandled) {
                this.child.kill("SIGKILL");
            }
        }, 5_000);
        this.forceKillTimeout.unref();

        return true;
    }
}

module.exports = DuststreamerProcess;
