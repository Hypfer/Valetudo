const createMiioHeader = require("./MiioHeader");
const Logger = require("../Logger");
const MiioTimeoutError = require("./MiioTimeoutError");
const RetryWrapperSurrenderError = require("./RetryWrapperSurrenderError");
const Semaphore = require("semaphore");

const STATES = Object.freeze({
    HANDSHAKING: "handshaking",
    CONNECTED: "connected"
});

/**
 * Adds handshake & retry logic to a MiioSocket.
 * Only used for local connections.
 */
class RetryWrapper {
    /**
     * @param {import("./MiioSocket")} socket
     * @param {() => Buffer} tokenProvider
     */
    constructor(socket, tokenProvider) {
        this.miioSocket = socket;
        this.miioSocket.registerOnEmptyPacketHook(this.checkHandshakeCompleted.bind(this));
        this.tokenProvider = tokenProvider;

        this.mutex = Semaphore(1);

        this.handshake().then(() => {
            Logger.trace(`Initial handshake successful. Stamp ${this.miioSocket.codec.stamp.val}`);
        }).catch((e) => {
            Logger.warn("Error in initial handshake", e);
        });
    }

    /**
     * @param {import("./DecodedMiioPacket")} msg
     * @returns {void}
     */
    checkHandshakeCompleted(msg) {
        //Because the miioSocket handles the stamp by itself, we just need to set our internal state if we see one
        if (this.state === STATES.HANDSHAKING && msg.stamp > 0) {
            this.state = STATES.CONNECTED;

            Logger.debug(`<<= ${this.miioSocket.name}: handshake complete. Stamp ${this.miioSocket.codec.stamp.val}`);
        }
    }

    /**
     * @param {boolean} [force] Whether to force a new handshake
     * @returns {Promise<void>}
     */
    async handshake(force) {
        //Abort new handshake request if we're still handshaking
        if (this.state === STATES.HANDSHAKING || (this.state === STATES.CONNECTED && force !== true)) {
            return;
        }

        this.state = STATES.HANDSHAKING;

        return new Promise((resolve, reject) => {
            this.loopHandshake(() => {
                resolve();
            });
        });
    }

    /**
     * @private
     */
    sendHandshake() {
        const packet = createMiioHeader();
        Logger.debug(`>>> ${this.miioSocket.name}: HandshakePacket()`);
        this.miioSocket.socket.send(packet, 0, packet.length, this.miioSocket.rinfo.port, this.miioSocket.rinfo.address);
    }

    /**
     * @private
     * @param {Function} callback
     */
    loopHandshake(callback) {
        if (this.state === STATES.CONNECTED) {
            callback();
        } else {
            this.sendHandshake();

            setTimeout(() => {
                this.loopHandshake(callback);
            }, 300);
        }
    }

    /**
     * Sends a message on the MiioSocket.
     * Performs multiple retries on timeout and also does a handshake if this wasn't yet done on the connection.
     *
     * Will block and wait for an existing request to finish if there is one
     *
     * @param {object?} msg JSON object to send to remote
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendMessage(msg, options = {}) {
        return new Promise((resolve, reject) => {
            this.mutex.take(() => {
                this.sendMessageHelper(msg, options).then(response => {
                    this.mutex.leave();

                    resolve(response);
                }).catch(err => {
                    this.mutex.leave();

                    reject(err);
                });
            });
        });
    }

    /**
     * @param {object} msg JSON object to send to remote
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @return {Promise<object>}
     */
    sendMessageHelper(msg, options) {
        return new Promise((resolve, reject) => {
            /*
                The alternative to this in-method function declaration would be some insanity like
                RetryWrapper.sendMessageHelperHelper(msg, options, resolve, reject)
             */
            const doRetry = () => {
                this.retryHandshakeHelper(msg, options).then(() => {
                    this.sendMessageHelper(msg, options).then(response => {
                        resolve(response);
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            };


            //Make sure that we have a valid recent stamp. Without it, we don't even have to try sending something
            if (this.miioSocket.codec.stamp.isValid()) {
                this.miioSocket.sendMessage(msg, {timeout: options.timeout}).then(response => {
                    resolve(response);
                }).catch(err => {
                    if (err instanceof MiioTimeoutError && !(err instanceof RetryWrapperSurrenderError)) {
                        doRetry();
                    } else {
                        reject(err); //Throw this further up if it's not a timeout
                    }
                });
            } else {
                doRetry();
            }
        });
    }

    /**
     *
     * This will either
     * - handshake and resolve
     * - increment the retry counter by modifying the options parameter and resolve
     * - throw if retrying doesn't make sense anymore
     *
     * @private
     *
     * @param {object?} msg JSON object to send to remote
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    async retryHandshakeHelper(msg, options = {}) {
        if (options.retries > 100) { // undefined > 100 is false
            Logger.warn("Unable to reach vacuum. Giving up after 100 tries");

            throw new RetryWrapperSurrenderError(msg);
        }

        // ++undefined is NaN and NaN is falsy. See: https://stackoverflow.com/a/13298258
        options.retries = ++options.retries || 0;


        if (options.retries % 10 === 0 && options.retries >= 10) {
            // We may want to refresh the token from fs just to be sure
            let newToken = this.tokenProvider();

            if (!(this.miioSocket.codec.token.equals(newToken))) {
                Logger.info("Got an expired token. Changing to new");

                this.miioSocket.codec.setToken(newToken);
            } else {
                Logger.debug("Token is okay, however we're unable to reach the vacuum", {
                    retries: options.retries,
                    msg: msg
                });
            }

            // Also do another handshake just to be sure our stamp is correct.
            await this.handshake(true);
        }

        // remove all remains of a previous attempt
        delete(msg["id"]);
    }

    async shutdown() {
        await this.miioSocket.shutdown();
    }
}

module.exports = RetryWrapper;
