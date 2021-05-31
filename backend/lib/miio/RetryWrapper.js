const createMiioHeader = require("./MiioHeader");
const Logger = require("../Logger");
const MiioInvalidStampError = require("./MiioInvalidStampError");
const MiioTimeoutError = require("./MiioTimeoutError");

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
        this.miioSocket.onEmptyPacket = this.checkHandshakeCompleted.bind(this);
        this.tokenProvider = tokenProvider;

        this.handshake().then(() => {
            Logger.trace("Initial handshake successful");
        }).catch((e) => {
            Logger.warn("Error in initial handshake", e);
        });
    }

    checkHandshakeCompleted(msg) {
        //Because the miioSocket handles the stamp by itself, we just need to set our internal state if we see one
        if (this.state === STATES.HANDSHAKING && msg.stamp) {
            this.state = STATES.CONNECTED;

            Logger.debug("<<= " + this.miioSocket.name + ": handshake complete");
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
        Logger.debug(">>> " + this.miioSocket.name + ": HandshakePacket()");
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
     * Sends a {'method': method, 'params': args} message on the MiioSocket.
     * Performs retries on timeout, does a handshake if this wasn't yet done on the connection.
     *
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    async sendMessage(method, args = [], options = {}) {
        const msg = {method: method, params: args};

        try {
            if (!this.miioSocket.stamp.isValid()) {
                // Trigger retry after performing new handshake
                // noinspection ExceptionCaughtLocallyJS
                throw new MiioInvalidStampError();
            }

            return await this.miioSocket.sendMessage(
                msg,
                {
                    timeout: options.timeout
                }
            );
        } catch (e) {
            if (!(e instanceof MiioTimeoutError) && !(e instanceof MiioInvalidStampError)) {
                throw e; //Throw this further up if it's not expected
            }

            options.retries = options.retries !== undefined ? options.retries : 0;

            if (options.retries > 100) {
                Logger.error("Unable to reach vacuum. Giving up after 100 tries");

                //Maybe resetting the ID helps?
                this.miioSocket.nextId = 0;

                //Throw this further up instead of retrying
                throw new MiioTimeoutError(msg);
            }

            options.retries++;

            if (options.retries % 10 === 0 && options.retries >= 10) {
                // We may want to refresh the token from fs just to be sure
                let newToken = this.tokenProvider();

                if (!(this.miioSocket.codec.token.equals(newToken))) {
                    Logger.info("Got an expired token. Changing to new");

                    this.miioSocket.codec.setToken(newToken);
                } else {
                    Logger.warn("Token is okay, however we're unable to reach the vacuum", {
                        retries: options.retries,
                        method: method,
                        args: args
                    });
                }

                // Also do another handshake just to be sure our stamp is correct.
                await this.handshake(true);
            }

            //Increment the MsgId by 1000 to catch up
            this.miioSocket.nextId += 1000;

            //Try again
            return this.sendMessage(method, args, options);
        }
    }
}

module.exports = RetryWrapper;
