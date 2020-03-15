const HandshakePacket = require("./HandshakePacket");
const Logger = require("../Logger");
const MiioSocket = require("./MiioSocket");

/**
 * Adds handshake & retry logic to a MiioSocket.
 * Only used for local connections.
 */
class RetryWrapper {
    /**
     * @param socket {import("../miio/MiioSocket")}
     * @param tokenProvider {function}
     */
    constructor(socket, tokenProvider) {
        socket.onEmptyPacket = this.onMessage.bind(this);
        this.miioSocket = socket;
        this.tokenProvider = tokenProvider;
        this.handshake();
    }

    onMessage(msg) {
        if (this.state == "handshaking" && msg.stamp) {
            this.onHandshakeCompleted();
        }
    }

    /** @param {boolean=} force Whether to force a new handshake */
    handshake(force) {
        if (this.state == "handshaking" || (this.state == "connected" && !force)) {
            return this.handshakePromise;
        }
        this.state = "handshaking";
        this.handshakePromise = new Promise((resolve, reject) => {
            this.onHandshakeCompleted = resolve;
            this.onHandshakeFailed = reject;
        }).then(() => {
            clearTimeout(this.handshakeTimeout);
            Logger.debug("<<= " + this.miioSocket.name + ": handshake complete");
            this.state = "connected";
        });
        const handshakeFn = () => {
            const packet = new HandshakePacket();
            Logger.debug(">>> " + this.miioSocket.name + ": HandshakePacket()");
            this.miioSocket.socket.send(packet.header, 0, packet.header.length,
                this.miioSocket.rinfo.port, this.miioSocket.rinfo.address);
            this.handshakeTimeout = setTimeout(handshakeFn, 300);
        };
        handshakeFn();
        return this.handshakePromise;
    }

    /**
     * Sends a {'method': method, 'params': args} message on the MiioSocket.
     * Performs retries on timeout, does a handshake if this wasn't yet done on the connection.
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendMessage(method, args = [], options = {}) {
        if (!this.miioSocket.stamp.isValid()) {
            return this.handshake(false, method)
                .then(() => this.sendMessage(method, args, options));
        }
        return new Promise((resolve, reject) => {
            const onError = (err) => {
                const msg = {method: method, params: args};
                if (!(err instanceof MiioSocket.TimeoutError)) return;
                options.retries = options.retries !== undefined ? options.retries : 0;
                if (options.retries > 10000) {
                    reject(new MiioSocket.TimeoutError(msg));
                    // Since the service automatically restarts after exiting, this
                    // could help fixing things I'm missing now
                    Logger.error("Unable to reach vacuum");
                    process.exit(1);
                }
                options.retries++;
                if (options.retries % 10 === 0 && options.retries >= 10) {
                    // We may want to refresh the token from fs just to be sure
                    let newToken = this.tokenProvider();
                    if (!(this.miioSocket.codec.token.equals(newToken))) {
                        Logger.info("Got an expired token. Changing to new");
                        this.miioSocket.codec.setToken(newToken);
                    }
                }
                this.miioSocket.nextId += 1000;
                // Also do another handshake just to be sure our stamp is correct.
                this.handshake(true).then((id) => {
                    this.miioSocket
                        .sendMessage(msg, {timeout: options.timeout})
                        .then((res) => resolve(res), onError);
                }, (err) => reject(err));
            };
            this.miioSocket.sendMessage({method: method, params: args}, {timeout: options.timeout})
                .then((res) => resolve(res), onError);
        });


    }
}

module.exports = RetryWrapper;