// @ts-check
const HandshakePacket = require("./HandshakePacket");
const MiioSocket = require("./MiioSocket");

/**
 * Adds handshake & retry logic to a MiioSocket.
 * Only used for local connections.
 */
class RetryWrapper {
    /**
     * @param socket {MiioSocket}
     * @param ip {string}
     * @param tokenProvider {function}
     */
    constructor(socket, ip, tokenProvider) {
        socket.onMessage = this.onMessage.bind(this);
        this.ip = ip;
        /** @type {MiioSocket} */
        this.miioSocket = socket;
        this.handshakeInProgress = false;
        this.handshakeTimeout = null;
        this.tokenProvider = tokenProvider;
    }

    onMessage(msg) {
        if (this.handshakeInProgress && this.miioSocket.stamp) {
            clearTimeout(this.handshakeTimeout);
            this.handshakeInProgress = false;
            console.info('handshake complete');
        }
    }

    handshake() {
        if (this.handshakeInProgress) {
            return;
        }
        this.handshakeInProgress = true;
        this.handshakeTimeout = setTimeout(() => { this.handshakeInProgress = false; }, 100);
        const packet = new HandshakePacket();
        console.debug('sending HandshakePacket', packet.header, this.ip, MiioSocket.PORT);
        this.miioSocket.socket.send(packet.header, 0, packet.header.length, MiioSocket.PORT,
                                    this.ip);
    }

    /**
     * Sends a {'method': method, 'params': args} message on the MiioSocket.
     * Performs retries on timeout, does a handshake if this wasn't yet done on the connection.
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number} options.retries
     * @param {function} callback
     */
    sendMessage(method, args, options, callback) {
        if (!this.miioSocket.stamp.isValid()) {
            this.handshake();
            setTimeout(function tryAgainAfterHandshake() {
                console.debug('still waiting for handshake');
                this.sendMessage(method, args, options, callback);
            }.bind(this), 150);
            return;
        }
        const onTimeout = () => {
            options.retries = options.retries !== undefined ? options.retries : 0;
            if (options.retries > 10000) {
                // Since the service automatically restarts after crashing on an exception, this
                // could help fixing things I'm missing now
                throw new Error("Unable to reach vacuum");
            }
            options.retries++;
            if (options.retries % 10 === 0 && options.retries >= 10) {
                // We may want to refresh the token from fs just to be sure
                let newToken = this.tokenProvider();
                if (!(this.miioSocket.codec.token.equals(newToken))) {
                    console.info("Got an expired token. Changing to new");
                    this.miioSocket.codec.setToken(newToken);
                }
            }
            this.miioSocket.nextId += 1000;
            this.miioSocket.sendMessage({method: method, params: args}, callback, onTimeout);
        };
        this.miioSocket.sendMessage({method: method, params: args}, callback, onTimeout);
    }
}

module.exports = RetryWrapper;