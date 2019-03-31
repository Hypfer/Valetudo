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

    this.connectedRobot = {
        port: 1,
        ip: "",
        stamp: 0,
        state: 8 //With no data available, always assume that the robot is docked
    };

    this.socket.on("listening", () => {
        console.info("Dummycloud is spoofing " + this.spoofedIP + ":8053 on " + this.bindIP +":8053");

    });

    //TODO: There must be some way the robot signallizes that its bin is full.
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
                        //{"method":"props","id":210065859,"params":{"fan_power":60}}
                        //TODO: Forward this to mqtt/webinterface
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            result:"ok"
                        };
                        break;
                    case "event.status":
                        this.events.emit("miio.status", decodedResponse.msg);
                        if(
                            decodedResponse.msg.params &&
                            decodedResponse.msg.params[0] &&
                            decodedResponse.msg.params[0].state !== undefined
                        ) {
                            this.connectedRobot.state = decodedResponse.msg.params[0].state;
                            this.pollMap();
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
                    case "_sync.batch_gen_room_up_url":
                        let MAP_UPLOAD_URLS = [];

                        for(let i = 0; i < 4; i++) {
                            MAP_UPLOAD_URLS.push(this.mapUploadHost + "/api/miio/map_upload_handler?" + process.hrtime())
                        }
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            "result": MAP_UPLOAD_URLS
                        };

                        break;
                    case "event.back_to_dock": //TODO
                    case "event.error_code":
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            result:"ok"
                        };
                        break;
                }
            } else {
                if(decodedResponse.msg.id !== -1){
                    console.info("Unknown cloud message received:", JSON.stringify(decodedResponse.msg));
                }
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
        } else {
            //Since miio_client apparently accepts negative message ids, we can use them to distinguish the requests
            //Also, it doesn't care about using the same message id many times
            if(decodedResponse.msg && decodedResponse.msg.id < 0) {}

             else {
                console.info("No response for message:", JSON.stringify(decodedResponse.msg));
            }

        }
    });
};

Dummycloud.prototype.pollMap = function() {
    if(this.pollMapTimeout) {
        clearTimeout(this.pollMapTimeout);
    }

    var response = this.codec.encode(
        Buffer.from(JSON.stringify({'method': 'get_map_v1', 'id': -1}), "utf8"),
        new Stamp({val: this.connectedRobot.stamp}),
        this.deviceId
    );

    this.socket.send(response, 0, response.length, this.connectedRobot.port, this.connectedRobot.ip);

    this.pollMapTimeout = setTimeout(() => {
        this.pollMap()
    }, [4,5,6,7,11,15,16,17].indexOf(this.connectedRobot.state) !== -1 ? 200 : 60000);
};

module.exports = Dummycloud;