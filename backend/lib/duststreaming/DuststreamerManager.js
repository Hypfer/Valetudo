const DuststreamerProcess = require("./DuststreamerProcess");
const DuststreamerReceiver = require("./DuststreamerReceiver");
const Logger = require("../Logger");

class DuststreamerManager {
    /**
     * @param {object} options
     * @param {string} options.duststreamerPath
     * @param {string} options.platform
     * @param {string} options.device
     * @param {number} options.width
     * @param {number} options.height
     * @param {number} [options.framerate]
     * @param {number} [options.bitrate]
     * @param {string} [options.host]
     * @param {number} [options.port]
     */
    constructor(options) {
        this.duststreamerPath = options.duststreamerPath;
        this.platform = options.platform;
        this.device = options.device;
        this.width = options.width;
        this.height = options.height;
        this.framerate = options.framerate ?? 30;
        this.bitrate = options.bitrate ?? 1_000_000;
        this.host = options.host ?? "127.127.127.127";
        this.port = options.port ?? 12727;

        this.subscribers = new Set();
        this.duststreamerProcess = null;
        this.duststreamerReceiver = null;

        this.state = DuststreamerManager.STATE.IDLE;

        this.lastDatagramAt = 0;
        this.noSubscribersSince = null;
        this.respawnCooldownUntil = null;
        this.duststreamerSpawnedAt = 0;

        this.controlLoopTimeout = null;

        this.onShutdown = () => {
            this.stop();
        };

        process.on("exit", this.onShutdown);
        process.on("SIGINT", this.onShutdown);
        process.on("SIGTERM", this.onShutdown);
    }

    /**
     * @public
     * @returns {boolean}
     */
    canSubscribe() {
        return this.state !== DuststreamerManager.STATE.FAILED;
    }

    /**
     * @public
     * @param {any} subscriber
     */
    registerSubscriber(subscriber) {
        if (this.subscribers.size >= 4) {
            Logger.debug("More than 4 subscribers are connected to the duststreamer. Terminating the oldest connection.");

            this.subscribers.values().next().value?.destroy?.();
        }

        this.subscribers.add(subscriber);

        subscriber.onClose(() => {
            this.unregisterSubscriber(subscriber);
        });

        this.doControlLoopCycle();
    }

    /**
     * @public
     * @param {any} subscriber
     */
    unregisterSubscriber(subscriber) {
        this.subscribers.delete(subscriber);

        if (this.subscribers.size === 0) {
            this.doControlLoopCycle();
        }
    }

    /**
     * @private
     */
    scheduleNextControlLoopCycle() {
        const now = Date.now();
        let nextCheckAt = Infinity;

        if (this.noSubscribersSince !== null) {
            nextCheckAt = Math.min(nextCheckAt, this.noSubscribersSince + (3 * 60 * 1_000));
        }

        switch (this.state) {
            case DuststreamerManager.STATE.STARTING:
                nextCheckAt = Math.min(nextCheckAt, this.duststreamerSpawnedAt + 15_000);
                break;

            case DuststreamerManager.STATE.STREAMING:
                nextCheckAt = Math.min(nextCheckAt, this.lastDatagramAt + 5_000);
                break;

            case DuststreamerManager.STATE.FAILED:
                nextCheckAt = Math.min(nextCheckAt, this.respawnCooldownUntil);
                break;
        }

        if (nextCheckAt === Infinity || nextCheckAt <= now) {
            return;
        }

        this.controlLoopTimeout = setTimeout(() => {
            this.doControlLoopCycle();
        }, nextCheckAt - now);
    }


    /**
     * @private
     */
    doControlLoopCycle() {
        if (this.controlLoopTimeout) {
            clearTimeout(this.controlLoopTimeout);

            this.controlLoopTimeout = null;
        }

        const now = Date.now();

        if (this.subscribers.size > 0) {
            this.noSubscribersSince = null;
        } else if (this.noSubscribersSince === null) {
            this.noSubscribersSince = now;
        }

        if (this.state === DuststreamerManager.STATE.FAILED && now >= this.respawnCooldownUntil) {
            this.state = DuststreamerManager.STATE.IDLE;
            this.respawnCooldownUntil = null;
        }

        if (this.state === DuststreamerManager.STATE.STARTING || this.state === DuststreamerManager.STATE.STREAMING) {
            if (this.duststreamerProcess === null || !this.duststreamerProcess.isAlive() || this.duststreamerReceiver === null) {
                this.duststreamerProcess?.kill();
                this.duststreamerProcess = null;

                this.duststreamerReceiver?.close();
                this.duststreamerReceiver = null;

                this.state = DuststreamerManager.STATE.FAILED;
                this.respawnCooldownUntil = Date.now() + 60_000;

                this.dropAllSubscribers();
            }
        }

        switch (this.state) {
            case DuststreamerManager.STATE.IDLE:
                if (this.subscribers.size > 0) {
                    this.startStreamer();
                }

                break;

            case DuststreamerManager.STATE.STARTING:
                if (now - this.duststreamerSpawnedAt > 15_000 && this.duststreamerProcess?.kill()) {
                    Logger.warn("duststreamer pipeline did not start producing frames within 15000ms. Killing.");
                }

                break;

            case DuststreamerManager.STATE.STREAMING:
                if (now - this.lastDatagramAt > 5_000) {
                    if (this.duststreamerProcess?.kill()) {
                        Logger.warn("duststreamer pipeline stopped producing frames. Killing.");
                    }

                    this.dropAllSubscribers();
                }

                break;

            case DuststreamerManager.STATE.FAILED:
                if (this.subscribers.size > 0) {
                    this.dropAllSubscribers();
                }

                break;
        }

        if (this.noSubscribersSince !== null && now - this.noSubscribersSince > 3 * 60 * 1_000) {
            this.stop();
        }

        this.scheduleNextControlLoopCycle();
    }

    /**
     * @private
     */
    startStreamer() {
        this.state = DuststreamerManager.STATE.STARTING;
        this.duststreamerSpawnedAt = Date.now();

        const streamer = new DuststreamerProcess({
            binaryPath: this.duststreamerPath,
            args: this.buildDuststreamerArgs(),
            onPlaying: () => {
                if (this.duststreamerProcess === streamer) {
                    if (this.state === DuststreamerManager.STATE.STARTING) {
                        this.state = DuststreamerManager.STATE.STREAMING;
                        this.lastDatagramAt = Date.now();

                        Logger.debug("duststreamer pipeline running");
                    }
                }

                this.doControlLoopCycle();
            },
            onPipelineError: (message) => {
                Logger.debug("duststreamer pipeline error:", message);

                if (this.duststreamerProcess === streamer) {
                    streamer.kill();
                }

                this.doControlLoopCycle();
            },
            onGone: () => {
                if (this.duststreamerProcess === streamer) {
                    this.duststreamerProcess = null;
                }

                this.doControlLoopCycle();
            }
        });

        this.duststreamerProcess = streamer;

        this.duststreamerReceiver = new DuststreamerReceiver({
            host: this.host,
            port: this.port,
            onDatagram: (buf) => {
                this.lastDatagramAt = Date.now();

                for (const subscriber of this.subscribers) {
                    if (!subscriber.write(buf)) {
                        this.subscribers.delete(subscriber);

                        subscriber.destroy();
                    }
                }
            },
            onSocketError: () => {
                this.duststreamerReceiver?.close();
                this.duststreamerReceiver = null;

                this.doControlLoopCycle();
            }
        });
    }

    /**
     * @public
     */
    stop() {
        if (this.controlLoopTimeout) {
            clearTimeout(this.controlLoopTimeout);
            this.controlLoopTimeout = null;
        }

        if (this.duststreamerProcess) {
            this.duststreamerProcess.kill();

            this.duststreamerProcess = null;
        }

        this.duststreamerReceiver?.close();
        this.duststreamerReceiver = null;

        this.dropAllSubscribers();

        this.state = DuststreamerManager.STATE.IDLE;
        this.respawnCooldownUntil = null;
        this.noSubscribersSince = null;
    }

    /**
     * @private
     */
    dropAllSubscribers() {
        if (this.subscribers.size === 0) {
            return;
        }

        for (const subscriber of this.subscribers) {
            subscriber.destroy();
        }

        this.subscribers.clear();
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
}

module.exports = DuststreamerManager;

DuststreamerManager.STATE = Object.freeze({
    IDLE: "idle",
    STARTING: "starting",
    STREAMING: "streaming",
    FAILED: "failed"
});
