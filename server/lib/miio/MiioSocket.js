const Codec = require("./Codec");
const createMiioHeader = require("./MiioHeader");
const Logger = require("../Logger");
const MiioTimeoutError = require("./MiioTimeoutError");
const Stamp = require("./Stamp");

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
     * @param {number=} options.deviceId The unique Device-id of your robot
     * @param {{address: string, port: number}=} options.rinfo
     * @param {number=} options.timeout timeout in milliseconds to wait for a response
     * @param {(msg: any) => void} options.onMessage
     * @param {(() => void)=} options.onConnected function to call after completing a handshake
     * @param {string} options.name Name used to disambiguate logging messages
     * @param {boolean=} options.isServerSocket Whether this is a server socket (send pongs)
     */
    constructor(options) {
        this.codec = new Codec({token: options.token});
        this.deviceId = options.deviceId;
        this.socket = options.socket;
        this.rinfo = options.rinfo;
        this.timeout = options.timeout ?? 500; // default timeout: 0.5s
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
        this.isServerSocket = options.isServerSocket;
        this.onEmptyPacket = null;

        this.socket.on("message", (incomingMsg, rinfo) => {
            this.rinfo = rinfo;
            // Logger.trace('incoming', this.name, incomingMsg);
            const decodedResponse = this.codec.handleResponse(incomingMsg);
            const token = decodedResponse.token;
            if (token && token.toString("hex") !== "ffffffffffffffffffffffffffffffff" &&
                token.toString("hex") !== "00000000000000000000000000000000" &&
                !(this.codec.token.equals(token))
            ) {
                Logger.info("Got token from handshake:", decodedResponse.token.toString("hex"));
                this.token = token;
                this.codec.setToken(token);
            }
            this.deviceId = decodedResponse.deviceId;
            const msg = decodedResponse.msg;
            const pending = msg && msg["id"] && this.pendingRequests[msg["id"]];

            this.traceOrDebug((msg && msg["method"]) || (pending && pending.method),
                "<<< " + this.name + (msg ? ":" : "*"), JSON.stringify(msg ?? {stamp: decodedResponse.stamp}));

            if (msg === null) {
                // Logger.debug("<<|" + this.name, incomingMsg);
                // robot server sockets: stamp == 0xFFFFFFFF -> respond with current time
                //                                      else -> respond the same stamp
                // cloud server sockets: always respond with current time
                if (decodedResponse.stamp === 0) { // Initial TimeSync Packet
                    Logger.debug("^-- initial timesync packet");

                    /*
                        Important note: This causes the miio_client to restart which is bad
                         if this is sent on each keep-alive packet

                         Make sure to only send this on the initial packet
                     */
                    if (this.isServerSocket) {
                        // Respond with current time
                        const response = createMiioHeader({timestamp: new Date().getTime() / 1000});
                        Logger.debug(">>> Responding to timesync request");
                        this.socket.send(response, 0, response.length, this.rinfo.port, this.rinfo.address);
                    }
                } else if (this.stamp.val === decodedResponse.stamp) {
                    // pong packet. discard
                    Logger.debug(this.name +": Discarding pong");
                    return;
                } else {
                    if (this.stamp.val === undefined || this.stamp.val <= decodedResponse.stamp) {
                        // keep-alive packet. respond with echo
                        Logger.debug(">>> " + this.name + (msg ? ":" : "*"), JSON.stringify({stamp: decodedResponse.stamp}));
                        this.socket.send(incomingMsg, 0, incomingMsg.length, this.rinfo.port, this.rinfo.address);
                    } else {
                        /**
                         * Valetudo and the miio_client might enter a 100% cpu busy loop here by exchanging messages with alternating stamps
                         * e.g. 34->33->34->33 etc
                         * every 1ms
                         *
                         * This could either be some kind of race condition or us misinterpreting something in the miio packet
                         * In any case, ignoring keep-alives for older stamps seems to help against it
                         */
                        Logger.warn("MiioSocket " + this.name + ": Received keep-alive packet with stamp " + decodedResponse.stamp + " but we're at " + this.stamp.val + ". Discarding.");
                    }
                }
            }

            this.stamp = new Stamp({val: decodedResponse.stamp}).orNew();

            if (msg !== null) {
                if (msg["id"] && (msg["result"] !== undefined || msg["error"] !== undefined)) {
                    if (pending) {
                        clearTimeout(pending.timeout_id);

                        if (msg["error"]) {
                            Logger.info("Miio error response", msg);
                            pending.reject(msg["error"]);
                        } else {
                            pending.resolve(msg["result"]);
                        }

                        delete this.pendingRequests[msg["id"]];
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
                if (typeof this.onEmptyPacket === "function") {
                    this.onEmptyPacket(decodedResponse);
                }
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
     * @param {object?} msg JSON object to send to remote
     * @param {object} options
     * @param {number=} options.timeout timeout in milliseconds, in case of timeout returns a failed
     *     promise with err = 'timeout'
     * @returns {Promise<object>}
     */
    sendMessage(msg, options = {}) {
        return new Promise((resolve, reject) => {
            if (msg !== null && msg !== undefined && !msg["id"]) {
                if (this.nextId > 0x7fffffff) { // assuming it's a signed 32bit integer
                    this.nextId = 0;
                }
                msg["id"] = this.nextId++;
            }
            if (msg !== null && msg !== undefined && !msg["result"] && !msg["error"]) {
                this.pendingRequests[msg["id"]] = {
                    resolve: resolve,
                    reject: reject,
                    method: msg["method"],
                    timeout: () => {
                        Logger.debug(this.name, "request", msg["id"], msg["method"], "timed out");
                        delete this.pendingRequests[msg["id"]];

                        if (this.isServerSocket && this.connected === true) {
                            Logger.info("Cloud message timed out. Assuming that we're not connected anymore");

                            this.connected = false;
                        }


                        reject(new MiioTimeoutError(msg));
                    }
                };

                this.pendingRequests[msg["id"]].timeout_id = setTimeout(
                    this.pendingRequests[msg["id"]].timeout,
                    options.timeout || this.timeout
                );
            }
            const payload = msg === null ? null : Buffer.from(JSON.stringify(msg), "utf8");
            const packet = this.codec.encode(payload, this.stamp.orNew(), this.deviceId);

            this.traceOrDebug(msg && msg["method"], ">>> " + this.name + ":", JSON.stringify(msg));
            this.socket.send(packet, 0, packet.length, this.rinfo.port, this.rinfo.address);
        });
    }

    /** Sends a ping / keepalive message. */
    sendPing() {
        this.sendMessage(null);
    }

    /**
     * Logs a message, uses trace or debug verbosity based on the method name.
     * This is to avoid creating too verbose logs in debug mode with frequently repeated messages.
     *
     * @param {string} method RPC method name
     * @param {string} msg
     * @param {any[]} args
     */
    traceOrDebug(method, msg, ...args) {
        (TRACE_METHODS.includes(method) ? Logger.trace(msg, ...args) : Logger.debug(msg, ...args));
    }

    /**
     * Shutdown the socket.
     *
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

module.exports = MiioSocket;
