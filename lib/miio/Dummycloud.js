const dgram = require("dgram");

const TimeSyncPacket = require("./TimeSyncPacket");
const Codec = require("./Codec");
const Stamp = require("./Stamp");

/**
 *
 * @param options {object}
 * @param options.spoofedIP {string} The IP we've told miio we are
 * @param options.cloudKey {string} The pre-shared unique key of your robot
 * @param options.bindIP {string} "127.0.0.1" on the robot, "0.0.0.0" in development
 * @constructor
 */
const Dummycloud = function (options) {
    this.spoofedIP = options.spoofedIP;
    this.cloudKey = options.cloudKey;
    this.bindIP = options.bindIP;
    this.codec = new Codec({token: this.cloudKey});

    this.socket = dgram.createSocket("udp4");
    this.socket.bind(8053, this.bindIP);


    this.socket.on("listening", () => {
        console.info("Dummycloud is spoofing " + this.spoofedIP + ":8053 on " + this.bindIP +":8053");
    });

    this.socket.on("message", (incomingMsg, rinfo) => {
        const decodedResponse = this.codec.handleResponse(incomingMsg);
        let response;
        let responseJSON;

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
                        //[{"msg_ver":2,"msg_seq":6055,"state":8,"battery":100,"clean_time":3036,"clean_area":40690000,"error_code":0,"map_present":1,"in_cleaning":0,"fan_power":60,"dnd_enabled":0}]}
                        //TODO: Forward this to mqtt/webinterface
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
                        //TODO MAPUPLOAD!
                        responseJSON = {
                            id: decodedResponse.msg.id,
                            error:{
                                code: -7,
                                message: "unknow device"
                            }
                        }


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
        } else {
            console.info("No response for message:", JSON.stringify(decodedResponse.msg));
        }
    });
};

module.exports = Dummycloud;