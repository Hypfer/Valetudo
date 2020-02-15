const HandshakePacket = require("./HandshakePacket");
const Logger = require("../Logger");

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
        this.originalMessageHandler = socket.onMessage;
        socket.onMessage = this.onMessage.bind(this);
        this.miioSocket = socket;
        this.handshakeInProgress = false;
        this.handshakeTimeout = null;
        this.tokenProvider = tokenProvider;
    }

    onMessage(msg) {
        if (this.handshakeInProgress && this.miioSocket.stamp) {
            clearTimeout(this.handshakeTimeout);
            this.handshakeInProgress = false;
            Logger.debug("<<= " + this.miioSocket.name + ": handshake complete");
        }
        this.originalMessageHandler(msg);
    }

    handshake() {
        if (this.handshakeInProgress) {
            return;
        }
        this.handshakeInProgress = true;
        this.handshakeTimeout = setTimeout(() => {
            this.handshakeInProgress = false;
        }, 100);
        const packet = new HandshakePacket();
        Logger.debug(">>> " + this.miioSocket.name + ": HandshakePacket()");
        this.miioSocket.socket.send(packet.header, 0, packet.header.length,
            this.miioSocket.rinfo.port, this.miioSocket.rinfo.address);
    }

    /**
     * Sends a {'method': method, 'params': args} message on the MiioSocket.
     * Performs retries on timeout, does a handshake if this wasn't yet done on the connection.
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @param {(err: object?, response: object?) => any} callback
     */
    sendMessage(method, args = [], options = {}, callback) {
        if (!this.miioSocket.stamp.isValid()) {
            this.handshake();
            setTimeout(function tryAgainAfterHandshake() {
                Logger.debug("=== " + this.miioSocket.name + ": still waiting for handshake");
                this.sendMessage(method, args, options, callback);
            }.bind(this), 150);
            return;
        }
        const onTimeout = () => {
            options.retries = options.retries !== undefined ? options.retries : 0;
            if (options.retries > 10000) {
                callback("timeout", null);
                // Since the service automatically restarts after crashing on an exception, this
                // could help fixing things I'm missing now
                throw new Error("Unable to reach vacuum");
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
            this.miioSocket.sendMessage({method: method, params: args}, {timeout: options.timeout})
                .then((res) => callback(null, res), (err) => {
                    if (err == "timeout")
                        onTimeout();
                });
        };
        this.miioSocket.sendMessage({method: method, params: args}, {timeout: options.timeout})
            .then((res) => callback(null, res), (err) => {
                if (err == "timeout")
                    onTimeout();
            });
    }
}

module.exports = RetryWrapper;