const Codec = require("./Codec");
const Logger = require("../Logger");
const Stamp = require("./Stamp");
const createMiioHeader = require("./MiioHeader");

/** Methods which are used frequently. Those will be logged with trace (instead of debug) verbosity. */
const TRACE_METHODS = [
    "get_curpos",
    "get_prop",
    "prop.box_type",
    "prop.err_state",
    "prop.mop_type",
    "prop.run_state",
    "prop.suction_grade",
    "set_uploadmap",
];

/*
 * A UDP socket connected to a miio_client.
 * Performs encryption and decryption, and tracks message ids and retries to provide an easy
 * promise interface.
 */
class MiioSocket {
    /**
     * @param {object} options
     * @param {import("dgram").Socket} options.socket
     * @param {Buffer} options.token The crypto key for this connection.
     * @param {string=} options.deviceId The unique Device-id of your robot
     * @param {{address: string, port: number}=} options.rinfo
     * @param {number=} options.timeout timeout in milliseconds to wait for a response
     * @param {function} options.onMessage
     * @param {function=} options.onConnected function to call after completing a handshake
     * @param {string} options.name Name used to disambiguate logging messages
     * @param {boolean=} options.doTimesync
     */
    constructor(options) {
        /** @const {Codec} */
        this.codec = new Codec({token: options.token});
        this.deviceId = options.deviceId;
        this.socket = options.socket;
        this.rinfo = options.rinfo;
        this.timeout = options.timeout || 500; // default timeout: 0.5s
        this.name = options.name;
        this.nextId = 1;
        this.stamp = new Stamp({});
        /**
         * @type {Object.<string, {
         *          timeout_id?: NodeJS.Timeout,
         *          timeout: () => void,
         *          resolve: (result: any) => void,
         *          reject: (err: any) => void,
         *          method: string
         *      }>}
         */
        this.pendingRequests = {};
        this.onMessage = options.onMessage;
        this.onConnected = options.onConnected;
        this.connected = false;
        this.doTimesync = options.doTimesync;
        this.onEmptyPacket = null;

        this.socket.on("message", (incomingMsg, rinfo) => {
            this.rinfo = rinfo;
            // Logger.log('incoming', this.name, incomingMsg);
            const decodedResponse = this.codec.handleResponse(incomingMsg);
            const token = decodedResponse.token;
            if (token && token.toString("hex") !== "ffffffffffffffffffffffffffffffff" &&
                token.toString("hex") !== "00000000000000000000000000000000") {
                Logger.info("Got token from handshake:", decodedResponse.token.toString("hex"));
                this.token = token;
                this.codec.setToken(token);
            }
            this.deviceId = decodedResponse.deviceId;
            const msg = decodedResponse.msg;
            const pending = msg && msg["id"] && this.pendingRequests[msg["id"]];

            this.traceOrDebug((msg && msg["method"]) || (pending && pending.method),
                "<<< " + this.name + (msg ? ":" : "*"), JSON.stringify(msg || {stamp: decodedResponse.stamp}));

            if (msg === null) {
                if (decodedResponse.stamp === 0) { // Initial TimeSync Packet
                    Logger.debug("^-- initial timesync packet");
                } else if (this.stamp.val === decodedResponse.stamp) {
                    // pong packet. discard
                    return;
                } else {
                    // keep-alive packet. respond with echo
                    this.socket.send(incomingMsg, 0, incomingMsg.length, this.rinfo.port, this.rinfo.address);
                }

                if (this.doTimesync) {
                    // Respond with current time
                    const response = createMiioHeader({timestamp: new Date().getTime() / 1000});
                    this.socket.send(response, 0, response.length, this.rinfo.port, this.rinfo.address);
                }
            }

            this.stamp = new Stamp({val: decodedResponse.stamp}).orNew();

            if (msg !== null) {
                if (msg["id"] && (msg["result"] !== undefined || msg["error"] !== undefined)) {
                    if (pending) {
                        clearTimeout(pending.timeout_id);

                        if (msg["error"]) {
                            Logger.info("error response", msg);
                            pending.reject(msg["error"]);
                        } else {
                            pending.resolve(msg["result"]);
                        }

                        delete this.pendingRequests[msg.id];
                    } else {
                        Logger.info(
                            "<< " + this.name + ": ignoring response for non-pending request",
                            JSON.stringify(msg)
                        );
                    }
                } else if (msg["error"]) {
                    Logger.warn("unhandled error response", msg);
                } else {
                    this.onMessage(msg);
                }
            } else {
                if (this.onEmptyPacket)
                    this.onEmptyPacket(decodedResponse);
            }

            if (!this.connected && this.onConnected) {
                this.connected = true;
                this.onConnected();
            }
        });
    }

    /**
     * Used for both sending commands or responses.
     *
     * @param {object} msg JSON object to send to remote
     * @param {object} options
     * @param {number=} options.timeout timeout in milliseconds, in case of timeout returns a failed
     *     promise with err = 'timeout'
     * @return {Promise<object>}
     */
    sendMessage(msg, options = {}) {
        return new Promise((resolve, reject) => {
            if (!msg.id) {
                if (this.nextId > 0x7fffffff) { // assuming it's a signed 32bit integer
                    this.nextId = 0;
                }
                msg.id = this.nextId++;
            }
            if (!msg.result && !msg.error) {
                this.pendingRequests[msg.id] = {
                    resolve: resolve,
                    reject: reject,
                    method: msg["method"],
                    timeout: () => {
                        Logger.debug(this.name, "request", msg["id"], msg["method"], "timed out");
                        delete this.pendingRequests[msg.id];
                        reject(new TimeoutError(msg));
                    }
                };
                this.pendingRequests[msg.id].timeout_id = setTimeout(
                    this.pendingRequests[msg.id].timeout, options.timeout || this.timeout);
            }
            let packet =
                this.codec.encode(msg === null ? "" : Buffer.from(JSON.stringify(msg), "utf8"),
                    this.stamp.orNew(), this.deviceId);

            this.traceOrDebug(msg && msg["method"], ">>> " + this.name + ":", JSON.stringify(msg));
            this.socket.send(packet, 0, packet.length, this.rinfo.port, this.rinfo.address);
        });
    }

    /**
     * Logs a message, uses trace or debug verbosity based on the method name.
     * This is to avoid creating too verbose logs in debug mode with frequently repeated messages.
     * @param {string} method RPC method name
     * @param {string} msg
     * @param {any[]} args
     */
    traceOrDebug(method, msg, ...args) {
        (TRACE_METHODS.includes(method) ? Logger.trace(msg, ...args) : Logger.debug(msg, ...args));
    }

    /**
     * Shutdown the socket.
     * @returns {Promise<void>}
     */
    shutdown() {
        return new Promise((resolve, reject) => {
            Logger.debug(this.name, "socket shutdown in progress...");
            try {
                this.socket.disconnect();
            } catch (err) {
                // do nothing, no connection is open
            }
            this.socket.close(() => {
                Logger.debug(this.name, "socket shutdown done");
                resolve();
            });
        });
    }
}

/** The default remote port. @const {int} */
MiioSocket.PORT = 54321;

class TimeoutError extends Error {
    /** @param {object} msg The request message that was not responded to. */
    constructor(msg) {
        super("request timed out:" + JSON.stringify(msg));
        this.name = "TimeoutError";
    }
}

MiioSocket.TimeoutError = TimeoutError;

module.exports = MiioSocket;