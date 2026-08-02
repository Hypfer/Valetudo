const child_process = require("child_process");
const dgram = require("dgram");

const Logger = require("./Logger");

const MAX_CLIENTS = 4;
const SPAWN_GRACE_MS = 15_000;
const UPSTREAM_IDLE_TIMEOUT_MS = 5_000;
const STOP_COOLDOWN_MS = 3 * 60 * 1_000;

class DuststreamerManager {
    /**
     * @param {object} options
     * @param {string} options.duststreamerPath
     * @param {string} options.platform
     * @param {string} options.device
     * @param {number} options.width
     * @param {number} options.height
     * @param {number} options.framerate
     * @param {number} options.bitrate
     * @param {string} [options.host]
     * @param {number} [options.port]
     */
    constructor(options) {
        this.duststreamerPath = options.duststreamerPath;
        this.platform = options.platform;
        this.device = options.device;
        this.width = options.width;
        this.height = options.height;
        this.framerate = options.framerate;
        this.bitrate = options.bitrate;
        this.host = options.host ?? "127.127.127.127";
        this.port = options.port ?? 12727;

        this.subscribers = new Set();
        this.socket = null;
        this.process = null;

        this.pipelineState = "stopped"; // "stopped" | "spawning" | "playing"
        this.lastDatagramAt = 0;

        this.spawnGraceTimer = null;
        this.watchdogTimer = null;
        this.stopTimer = null;

        this.onShutdown = () => {
            if (this.process) {
                this.process.kill("SIGTERM");
                this.process = null;
            }
        };
    }

    /**
     * @public
     * @param {any} subscriber
     */
    register(subscriber) {
        if (this.subscribers.size >= MAX_CLIENTS) {
            Logger.debug(
                `More than ${MAX_CLIENTS} subscribers are connected to the duststreamer. Terminating the oldest connection.`
            );

            const oldestSubscriber = this.subscribers.values().next().value;
            this.subscribers.delete(oldestSubscriber);
            oldestSubscriber?.destroy?.();
        }

        this.subscribers.add(subscriber);

        if (this.stopTimer) {
            clearTimeout(this.stopTimer);

            this.stopTimer = null;
        }

        subscriber.onClose(() => {
            this.unregister(subscriber);
        });

        this.ensureDuststreamer();
    }

    /**
     * @public
     * @param {any} subscriber
     */
    unregister(subscriber) {
        if (!this.subscribers.delete(subscriber)) {
            return;
        }

        if (this.subscribers.size === 0) {
            this.scheduleStop();
        }
    }

    /**
     * @private
     */
    ensureDuststreamer() {
        if (this.process) {
            return;
        }

        this.spawnDuststreamer();
        this.ensureReceiverSocket();
    }

    /**
     * @private
     */
    spawnDuststreamer() {
        if (this.process) {
            return;
        }

        const args = this.buildDuststreamerArgs();
        Logger.debug("Spawning duststreamer at", this.duststreamerPath, "with args", args);

        this.process = child_process.spawn(this.duststreamerPath, args, {
            stdio: ["ignore", "pipe", "pipe"]
        });

        this.pipelineState = "spawning";
        this.lastDatagramAt = 0;

        this.attachShutdownHandlers();
        this.startSpawnGrace();

        let stdoutBuf = "";
        if (this.process.stdout) {
            this.process.stdout.on("data", (chunk) => {
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

        if (this.process.stderr) {
            this.process.stderr.on("data", (chunk) => {
                const trimmed = chunk.toString().trim();
                if (trimmed) {
                    Logger.debug("duststreamer:", trimmed);
                }
            });
        }

        this.process.once("error", (err) => {
            Logger.warn("Error while spawning duststreamer", err);
            this.process = null;

            this.removeShutdownHandlers();
            this.closeSubscribers();
        });

        this.process.once("exit", (code, signal) => {
            if (code === 0) {
                Logger.debug("duststreamer exited cleanly");
            } else {
                Logger.debug("duststreamer exited unexpectedly with code", code, "and signal", signal);
            }
            this.process = null;
            this.pipelineState = "stopped";

            this.stopSpawnGrace();
            this.stopWatchdog();
            this.removeShutdownHandlers();
            this.closeSubscribers();
        });
    }

    /**
     * @private
     * @param {string} line
     */
    handleStdoutLine(line) {
        if (line === "PLAYING") {
            this.onPipelinePlaying();
        } else if (line.startsWith("ERROR:")) {
            this.onPipelineError(line.slice("ERROR:".length).trim());
        }
    }

    /**
     * @private
     */
    onPipelinePlaying() {
        if (this.pipelineState !== "spawning") {
            return;
        }

        this.pipelineState = "playing";
        this.lastDatagramAt = Date.now();
        this.stopSpawnGrace();
        this.startWatchdog();

        Logger.debug("duststreamer pipeline reached PLAYING");
    }

    /**
     * @private
     * @param {string} message
     */
    onPipelineError(message) {
        Logger.debug(`duststreamer pipeline error: ${message}. Stopping.`);
        this.stop();
    }

    /**
     * @public
     */
    stop() {
        if (this.stopTimer) {
            clearTimeout(this.stopTimer);
            this.stopTimer = null;
        }

        this.stopSpawnGrace();
        this.stopWatchdog();
        this.removeShutdownHandlers();
        this.closeSubscribers();
        this.closeReceiverSocket();

        if (this.process) {
            Logger.debug("Stopping duststreamer");
            this.process.kill("SIGTERM");
            this.process = null;
        }

        this.pipelineState = "stopped";
    }

    /**
     * @private
     */
    attachShutdownHandlers() {
        process.on("exit", this.onShutdown);
        process.on("SIGINT", this.onShutdown);
        process.on("SIGTERM", this.onShutdown);
    }

    /**
     * @private
     */
    removeShutdownHandlers() {
        process.off("exit", this.onShutdown);
        process.off("SIGINT", this.onShutdown);
        process.off("SIGTERM", this.onShutdown);
    }

    /**
     * @private
     */
    scheduleStop() {
        if (this.stopTimer) {
            return;
        }

        this.stopTimer = setTimeout(() => {
            this.stopTimer = null;

            if (this.subscribers.size === 0) {
                this.stop();
            }
        }, STOP_COOLDOWN_MS);
    }

    /**
     * @private
     */
    startSpawnGrace() {
        if (this.spawnGraceTimer) {
            return;
        }

        this.spawnGraceTimer = setTimeout(() => {
            this.spawnGraceTimer = null;

            if (this.pipelineState === "spawning") {
                Logger.warn(
                    `duststreamer did not reach PLAYING within ${SPAWN_GRACE_MS}ms. Stopping.`
                );

                this.stop();
            }
        }, SPAWN_GRACE_MS);
    }

    /**
     * @private
     */
    stopSpawnGrace() {
        if (this.spawnGraceTimer) {
            clearTimeout(this.spawnGraceTimer);
            this.spawnGraceTimer = null;
        }
    }

    /**
     * @private
     * @returns {string[]}
     */
    buildDuststreamerArgs() {
        return [
            "--platform", this.platform,
            "--device", this.device,
            "--width", `${this.width}`,
            "--height", `${this.height}`,
            "--framerate", `${this.framerate}`,
            "--bitrate", `${this.bitrate}`,
            "--host", this.host,
            "--port-ts", `${this.port}`
        ];
    }

    /**
     * @private
     */
    ensureReceiverSocket() {
        if (this.socket) {
            return;
        }

        Logger.debug("Binding duststreamer UDP receiver socket to", this.host + ":" + this.port);

        this.socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

        this.socket.on("message", (buf) => {
            this.lastDatagramAt = Date.now();

            for (const subscriber of this.subscribers) {
                if (!subscriber.write(buf)) {
                    this.subscribers.delete(subscriber);

                    subscriber.destroy();
                }
            }
        });

        this.socket.on("error", (err) => {
            Logger.warn("Error on UDP receiver socket", err);
            this.stop();
        });

        this.socket.bind(this.port, this.host, () => {
            Logger.debug("UDP receiver bound on", this.host + ":" + this.port);
        });
    }

    /**
     * @private
     */
    closeReceiverSocket() {
        if (!this.socket) {
            return;
        }

        Logger.debug("Closing duststreamer UDP receiver socket");
        this.socket.close();
        this.socket = null;
    }

    /**
     * @private
     */
    startWatchdog() {
        if (this.watchdogTimer) {
            return;
        }

        this.watchdogTimer = setInterval(() => {
            if (this.pipelineState !== "playing") {
                return;
            }

            if (Date.now() - this.lastDatagramAt > UPSTREAM_IDLE_TIMEOUT_MS) {
                Logger.debug(`Upstream idle for ${UPSTREAM_IDLE_TIMEOUT_MS}ms. Closing subscribers.`);

                this.closeSubscribers();
            }
        }, 1000);
    }

    /**
     * @private
     */
    stopWatchdog() {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);

            this.watchdogTimer = null;
        }
    }

    /**
     * @private
     */
    closeSubscribers() {
        if (this.subscribers.size === 0) {
            return;
        }

        for (const subscriber of this.subscribers) {
            subscriber.destroy();
        }

        this.subscribers.clear();
    }
}

module.exports = DuststreamerManager;
