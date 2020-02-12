const dgram = require("dgram");

const TimeSyncPacket = require("./TimeSyncPacket");
const Codec = require("./Codec");
const Stamp = require("./Stamp");

/**
 *
 * @param options {object}
 * @param options.spoofedIP {string} The IP we've told miio we are
 * @param options.cloudKey {string} The pre-shared unique key of your robot
 * @param options.deviceId {string} The unique Device-id of your robot
 * @param options.bindIP {string} "127.0.0.1" on the robot, "0.0.0.0" in development
 * @param options.mapUploadHost {string} "127.0.0.1" on the robot, ??? in development
 * @param options.events {EventEmitter}
 * @constructor
 */
const Dummycloud = function (options) {
    this.spoofedIP = options.spoofedIP;
    this.cloudKey = options.cloudKey;
    this.deviceId = options.deviceId;
    this.bindIP = options.bindIP;
    this.mapUploadHost = options.mapUploadHost;
    this.events = options.events;
    this.codec = new Codec({token: this.cloudKey});

    this.socket = dgram.createSocket("udp4");
    this.socket.bind(8053, this.bindIP);

    this.lastMapPoll = new Date(0);

    this.connectedRobot = {
        port: 1,
        ip: "",
        stamp: 0,
        status: {
            state: 8, //With no data available, always assume that the robot is docked
        }
    };

    this.socket.on("listening", () => {
        console.info("Dummycloud is spoofing " + this.spoofedIP + ":8053 on " + this.bindIP +":8053");
    });


    this.socket.on("message", (incomingMsg, rinfo) => {
        const decodedResponse = this.codec.handleResponse(incomingMsg);
        let response;
        let responseJSON;

        this.connectedRobot.port = rinfo.port;
        this.connectedRobot.ip = rinfo.address;
        this.connectedRobot.stamp = decodedResponse.stamp;

        if (decodedResponse.msg === null) {
            if(decodedResponse.stamp === 0) { //Initial TimeSync Packet
                //Respond with current time
                response = new TimeSyncPacket().header;

                console.info("Robot connected"); //TODO: Some kind of state which is available to the web


                //since it's connected, we force a poll
                setTimeout(() => {
                    this.pollStatus();
                }, 2500);
                setTimeout(() => {
                    this.pollMap();
                }, 3500);
            } else { //Keep-alive packet
                //Respond with echo
                response = incomingMsg;
            }
        } else if (decodedResponse.msg) {
            if (decodedResponse.msg.method) {
                switch (decodedResponse.msg.method) {
                    case "_otc.info":
                        responseJSON = {
                            "id": decodedResponse.msg.id,
                            "result": {
                                "otc_list": [{
                                    "ip": this.spoofedIP,
                                    "port": 8053
                                }
                                ],
                                "otc_test": {
                                    "list": [{
                                        "ip": this.spoofedIP,
                                        "port": 8053
                                    }
                                    ],
                                    "interval": 1800,
                                    "firsttest": 1193
                                }
                            }
                        };
                        break;
                    case "props":
                        Object.assign(this.connectedRobot.status, decodedResponse.msg.params);
                        this.events.emit("miio.status", this.connectedRobot.status);

                        responseJSON = {
                            id: decodedResponse.msg.id,
                            result:"ok"
                        };

                        break;
                    case "event.status":
                        if(
                            decodedResponse.msg.params &&
                            decodedResponse.msg.params[0] &&
                            decodedResponse.msg.params[0].state !== undefined
                        ) {
                            Object.assign(this.connectedRobot.status, decodedResponse.msg.params[0]);
                            this.pollMap();
                            this.events.emit("miio.status", this.connectedRobot.status);
                        }

                        responseJSON = {
                            id: decodedResponse.msg.id,
                            result:"ok"
                        };
                        break;
                    case "_sync.getctrycode":
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            result: {ctry_code: "DE"} //TODO
                        };
                        break;
                    case "_sync.getAppData":
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            error:{
                                code: -6,
                                message: "not set app data"
                            }
                        };
                        break;
                    case "_sync.gen_presigned_url":
                    case "_sync.batch_gen_room_up_url": {
                        let MAP_UPLOAD_URLS = [];

                        for(let i = 0; i < 4; i++) {
                            MAP_UPLOAD_URLS.push(this.mapUploadHost + "/api/miio/map_upload_handler?" + process.hrtime());
                        }
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            "result": MAP_UPLOAD_URLS
                        };

                        break;
                    }
                    case "event.back_to_dock": //TODO
                    case "event.error_code":
                    case "event.bin_full": //TODO: bring to UI
                    case "event.relocate_failed_back":
                    case "event.goto_target_succ":
                    case "event.target_not_reachable":
                    case "event.low_power_back": //If the robot is currently cleaning and the battery drops below 20% it drives home to charge
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            result:"ok"
                        };
                        break;
                }

            //Since miio_client apparently accepts negative message ids, we can use them to distinguish the requests
            //Also, it doesn't care about using the same message id many times
            } else if(decodedResponse.msg.id  < 0) {
                switch(decodedResponse.msg.id) {
                    case Dummycloud.SERVER_REQUESTS.MAP:
                        if(Array.isArray(decodedResponse.msg.result) && decodedResponse.msg.result.length === 1) {
                            let timeout = [4,5,6,7,11,15,16,17].indexOf(this.connectedRobot.status.state) !== -1 ? 600 : 60000;

                            if(decodedResponse.msg.result[0] === "retry") {
                                timeout += 1000;
                            }

                            setTimeout(() => {
                                this.pollMap();
                            }, timeout);
                        }
                        break;
                    case Dummycloud.SERVER_REQUESTS.STATUS:
                        Object.assign(this.connectedRobot.status, decodedResponse.msg.result[0]);
                        this.events.emit("miio.status", this.connectedRobot.status);
                        break;
                }

            } else {
                console.info("Unknown cloud message received:", JSON.stringify(decodedResponse.msg));
            }
        }

        if(responseJSON) {
            response = this.codec.encode(
                Buffer.from(JSON.stringify(responseJSON), "utf8"),
                new Stamp({val: decodedResponse.stamp}),
                decodedResponse.deviceId
            );
        }

        if (response) {
            this.socket.send(response, 0, response.length, rinfo.port, rinfo.address);
        } else if(decodedResponse.msg.id > 0) {
            console.info("No response for message:", JSON.stringify(decodedResponse.msg));
        }
    });

    this.events.on("valetudo.dummycloud.pollmap", () => {
        this.pollMap();
    });
};

Dummycloud.prototype.pollMap = function() {//200ms is theoretically possible
    if(this.pollMapTimeout) {
        clearTimeout(this.pollMapTimeout);
    }

    const now = new Date();
    if(now - 600 > this.lastMapPoll) {
        this.lastMapPoll = now;

        var response = this.codec.encode(
            Buffer.from(JSON.stringify({'method': 'get_map_v1', 'id': -1}), "utf8"),
            new Stamp({val: this.connectedRobot.stamp}),
            this.deviceId
        );

        this.socket.send(response, 0, response.length, this.connectedRobot.port, this.connectedRobot.ip);
    }

    this.pollMapTimeout = setTimeout(() => {
        this.pollMap();
    }, 300000); //5 minutes
};

Dummycloud.prototype.pollStatus = function() {
    var response = this.codec.encode(
        Buffer.from(JSON.stringify({'method': 'get_status', 'id': -2}), "utf8"),
        new Stamp({val: this.connectedRobot.stamp}),
        this.deviceId
    );

    this.socket.send(response, 0, response.length, this.connectedRobot.port, this.connectedRobot.ip);
};

Dummycloud.SERVER_REQUESTS = {
    "MAP": -1,
    "STATUS": -2
};

/**
 * Shutdown Dummycloud
 * @returns {Promise<void>}
 */
Dummycloud.prototype.shutdown = function() {
    return new Promise((resolve, reject) => {
        console.debug("Dummycloud shutdown in progress...");

        try {
            this.socket.disconnect();
        } catch(err) {
            // do nothing, no connection is open
        }
        this.socket.close(() => {
            console.debug("Dummycloud shutdown done");
            resolve();
        });
    });
};

module.exports = Dummycloud;