const Codec = require("./Codec");
const createMiioHeader = require("./MiioHeader");
const Logger = require("../Logger");
const MiioErrorResponseRobotFirmwareError = require("./MiioErrorResponseRobotFirmwareError");
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
        this.nextId = 1; //Only used by cloud sockets

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
        /** @type {null | ((msg: import("./DecodedMiioPacket")) => void)} */
        this.onEmptyPacket = null;


        this.socket.on("message", (incomingMsg, rinfo) => {
            this.rinfo = rinfo;
            const decodedIncomingPacket = this.codec.decodeIncomingMiioPacket(incomingMsg);

            if (
                this.deviceId !== decodedIncomingPacket.deviceId &&
                decodedIncomingPacket.deviceId !== 0xffffffff // Handshake response did is always 0xffffffff and not the real one
            ) {
                this.deviceId = decodedIncomingPacket.deviceId;

                Logger.info(`Got new DeviceID: ${this.deviceId}`);
            }

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
                        this.codec.updateStamp(decodedIncomingPacket.stamp);
                        Logger.debug(">>> " + this.name + "*", {stamp: decodedIncomingPacket.stamp});


                        this.socket.send(incomingMsg, 0, incomingMsg.length, this.rinfo.port, this.rinfo.address);
                    }
                } else {
                    this.codec.updateStamp(decodedIncomingPacket.stamp);

                    /*
                        This exists so that the RetryWrapper can hook the message processing so that it
                        knows when a successful handshake happened
                     */
                    if (typeof this.onEmptyPacket === "function") {
                        this.onEmptyPacket(decodedIncomingPacket);
                    }
                }
            } else {
                this.codec.updateStamp(decodedIncomingPacket.stamp);

                if (msg["id"] && (msg["result"] !== undefined || msg["error"] !== undefined)) {
                    const pendingRequestWithMatchingMsgId = this.pendingRequests[msg["id"]];

                    if (pendingRequestWithMatchingMsgId) {
                        clearTimeout(pendingRequestWithMatchingMsgId.timeout_id);

                        if (msg["error"] !== undefined) {
                            /*
                                "user ack timeout" is sent by the miio_client if the robots business logic
                                fails to respond to a request from us in a timely fashion
                             */
                            if (msg["error"].message !== "user ack timeout") {
                                Logger.info("Miio error response", msg);
                            } else {
                                Logger.trace("Miio error response", msg);
                            }

                            pendingRequestWithMatchingMsgId.reject(
                                new MiioErrorResponseRobotFirmwareError(
                                    msg["error"].message,
                                    msg["error"]
                                )
                            );
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
                /*
                    This behaves differently, because the local socket might have other connections exhausting
                    msgIds, which is why we need to find a way to stay on top.

                    This problem should not exist with the cloud socket, allowing us to just count up
                    on each new message
                 */
                if (this.isCloudSocket) {
                    if (this.nextId > MAX_INT32) {
                        this.nextId = 1;
                    }

                    msg["id"] = this.nextId++;
                } else {
                    /*
                        Unexpectedly, it is not required for the next msgId to be larger than the previous one
                        It just needs to be different
                     */
                    msg["id"] = MiioSocket.calculateMsgId(new Date());
                }
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
                        // optional chaining due to a super rare race condition that only surfaced after 4 years 
                        this.pendingRequests[msgId]?.onTimeoutCallback();
                    },
                    options.timeout ?? this.timeout
                );
            }

            const packet = this.codec.encodeOutgoingMiioPacket(msg, this.deviceId);

            Logger.debug(">>> " + this.name + ":", msg);
            this.socket.send(packet, 0, packet.length, this.rinfo.port, this.rinfo.address);
        });
    }

    /**
     * @param {(msg: import("./DecodedMiioPacket")) => void} fn
     */
    registerOnEmptyPacketHook(fn) {
        this.onEmptyPacket = fn;
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

    /**
     * @private
     * @param {Date} date
     * @return {number} must be less than MAX_INT32
     */
    static calculateMsgId(date) {
        const now = date.getTime();

        if (now > FEB_1970_UNIXTIME_MS) { // If we're not in january 1970, assume that time is synced
            /*
                When time is synced, we shift our msgIds by one whole day in seconds so that even if our counter
                wraps, there won't be any collisions caused by the time sync.

                This assumes that the robot will sync its time in less than a day.
                If it takes longer, there will be a chance of msgId collisions.
                This however is unlikely as all known robots today (2022-02-26) reboot daily

                This also won't be an issue if the time is never synced at all.
                In that state, the amount of messages exchanged with the robot on the local interface will be limited to 1 per second,
                but apart from that, everything should just work up until MAX_INT32 seconds have passed since boot

                During normal operation, all messages should be sent via the cloud interface anyway, meaning that
                this limit should not have any effect at all
             */
            const id = Math.round(now / 10); //With a synced time, we'll have 100 unique MsgIds per second
            const offset = 24 * 60 * 60; // 1 day in seconds

            return offset + (id % (MAX_INT32 - offset)); // wrap if id + offset is larger than MAX_INT32
        } else {
            /*
                We're somewhere in january 1970 meaning that there's no synced time (yet)

                Therefore, we limit the amount of usable msgIds to one every second
                so that there are more IDs available for the 100-per-second synced time state
                without any risk of collisions right after the time sync
             */

            return Math.round(now / 1000);
        }
    }
}

const FEB_1970_UNIXTIME_MS = new Date("1970-02-01T00:00:00.000Z").getTime();
const MAX_INT32 = 0x7fffffff;

/** The default remote port. @const {int} */
MiioSocket.PORT = 54321;

module.exports = MiioSocket;
