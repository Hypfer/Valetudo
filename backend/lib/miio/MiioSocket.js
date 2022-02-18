const Codec = require("./Codec");
const createMiioHeader = require("./MiioHeader");
const Logger = require("../Logger");
const MiioTimeoutError = require("./MiioTimeoutError");

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
     * @param {{address: string, port: number}=} options.rinfo address and port of what we're talking to
     * @param {number=} options.timeout timeout in milliseconds to wait for a response
     * @param {(msg: any) => void} [options.onIncomingRequestMessage]
     * @param {(() => void)=} [options.onConnected] function to call after completing a handshake
     * @param {string} options.name Name used to disambiguate logging messages
     * @param {boolean=} options.isCloudSocket Cloud sockets send time sync replies
     */
    constructor(options) {
        this.codec = new Codec({token: options.token});
        this.deviceId = options.deviceId;
        this.socket = options.socket;
        this.rinfo = options.rinfo;
        this.timeout = options.timeout ?? 500; // default timeout: 0.5s
        this.name = options.name;
        this.nextId = 1;

        /**
         * @type {Object.<string, {
         *          timeout_id?: NodeJS.Timeout,
         *          onTimeoutCallback: () => void,
         *          resolve: (result: any) => void,
         *          reject: (err: any) => void,
         *          method: string
         *      }>}
         */
        this.pendingRequests = {};
        this.onIncomingRequestMessage = options.onIncomingRequestMessage;
        this.onConnected = options.onConnected;
        this.connected = false;
        this.isCloudSocket = options.isCloudSocket;
        this.onEmptyPacket = null;


        this.socket.on("message", (incomingMsg, rinfo) => {
            this.rinfo = rinfo;
            const decodedIncomingPacket = this.codec.decodeIncomingMiioPacket(incomingMsg);

            this.deviceId = decodedIncomingPacket.deviceId;
            const msg = decodedIncomingPacket.msg;

            Logger.debug(`<<< ${this.name}${msg ? ":" : "*"}`, msg ?? {stamp: decodedIncomingPacket.stamp});


            if (msg === null) {
                if (this.isCloudSocket) {
                    if (decodedIncomingPacket.stamp === 0) {
                        //Important note: Responding with a time sync packet causes the miio_client to restart

                        const response = createMiioHeader({timestamp: new Date().getTime() / 1000});
                        Logger.debug(">>> Responding to time sync request");

                        this.socket.send(response, 0, response.length, this.rinfo.port, this.rinfo.address);

                    } else if (
                        this.codec.stamp.val === undefined ||
                        this.codec.stamp.val < decodedIncomingPacket.stamp
                    ) {
                        // Keep-alive packet. Update our stamp and respond with echo
                        this.codec.updateStamp(decodedIncomingPacket.val);
                        Logger.debug(">>> " + this.name + "*", {stamp: decodedIncomingPacket.stamp});


                        this.socket.send(incomingMsg, 0, incomingMsg.length, this.rinfo.port, this.rinfo.address);
                    }
                } else {
                    this.codec.updateStamp(decodedIncomingPacket.val);

                    /*
                        This exists so that the RetryWrapper can hook the message processing so that it
                        knows when a successful handshake happened
                     */
                    if (typeof this.onEmptyPacket === "function") {
                        this.onEmptyPacket(decodedIncomingPacket);
                    }
                }
            } else {
                this.codec.updateStamp(decodedIncomingPacket.val);

                if (msg["id"] && (msg["result"] !== undefined || msg["error"] !== undefined)) {
                    const pendingRequestWithMatchingMsgId = this.pendingRequests[msg["id"]];

                    if (pendingRequestWithMatchingMsgId) {
                        clearTimeout(pendingRequestWithMatchingMsgId.timeout_id);

                        if (msg["error"] !== undefined) {
                            Logger.info("Miio error response", msg);

                            pendingRequestWithMatchingMsgId.reject(msg["error"]);
                        } else {
                            pendingRequestWithMatchingMsgId.resolve(msg["result"]);
                        }

                        delete this.pendingRequests[msg["id"]];
                    } else {
                        Logger.debug("<< " + this.name + ": ignoring response for non-pending request", msg);
                    }
                } else if (msg["error"]) {
                    Logger.warn("unhandled error response", msg);
                } else {
                    if (typeof this.onIncomingRequestMessage === "function") {
                        this.onIncomingRequestMessage(msg);
                    }
                }
            }

            if (!this.connected && typeof this.onConnected === "function") {
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
     * @param {number=} options.timeout timeout in milliseconds, in case of timeout returns a failed promise with err = 'timeout'
     * @returns {Promise<object>}
     */
    sendMessage(msg, options = {}) {
        return new Promise((resolve, reject) => {

            // If a message is a reply to a request from the robot, it will already have an ID
            if (msg !== null && msg !== undefined && !msg["id"]) {
                if (this.nextId > 0x7fffffff) { // assuming it's a signed 32bit integer
                    this.nextId = 0;
                }

                msg["id"] = this.nextId++;
            }

            /*
                If a message has a result or error property, it is a response to a request from the robot,
                meaning that we should not add it to our pending requests
             */
            if (msg !== null && msg !== undefined && !msg["result"] && !msg["error"]) {
                const msgId = msg["id"];

                this.pendingRequests[msgId] = {
                    resolve: resolve,
                    reject: reject,
                    method: msg["method"],
                    onTimeoutCallback: () => {
                        Logger.debug(`${this.name} request ${msgId} ${msg["method"]} timed out`);
                        delete this.pendingRequests[msgId];

                        if (this.isCloudSocket && this.connected === true) {
                            Logger.info("Cloud message timed out. Assuming that we're not connected anymore");

                            this.connected = false;
                        }


                        reject(new MiioTimeoutError(msg));
                    }
                };

                this.pendingRequests[msgId].timeout_id = setTimeout(
                    () => {
                        this.pendingRequests[msgId].onTimeoutCallback();
                    },
                    options.timeout ?? this.timeout
                );
            }

            const packet = this.codec.encodeOutgoingMiioPacket(msg, this.deviceId);

            Logger.debug(">>> " + this.name + ":", msg);
            this.socket.send(packet, 0, packet.length, this.rinfo.port, this.rinfo.address);
        });
    }

    /** Sends a ping / keepalive message. */
    sendPing() {
        this.sendMessage(null);
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
