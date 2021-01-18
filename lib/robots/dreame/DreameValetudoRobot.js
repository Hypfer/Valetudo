const zlib = require("zlib");
const capabilities = require("./capabilities");

const DreameMapParser = require("../../DreameMapParser");

const MiioValetudoRobot = require("../MiioValetudoRobot");
const entities = require("../../entities");
const ValetudoMap = require("../../entities/map/ValetudoMap");

const stateAttrs = entities.state.attributes;

class DreameValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {object} options.miotServices
     * @param {object} options.miotServices.MAP
     * @param {number} options.miotServices.MAP.SIID
     * @param {object} options.miotServices.MAP.ACTIONS
     * @param {object} options.miotServices.MAP.ACTIONS.POLL
     * @param {number} options.miotServices.MAP.ACTIONS.POLL.AIID
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);

        this.miotServices = options.miotServices;

        this.registerCapability(new capabilities.DreameWifiConfigurationCapability({
            robot: this
        }));
    }

    setEmbeddedParameters() {
        this.deviceConfPath = DreameValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = DreameValetudoRobot.TOKEN_FILE_PATH;
        this.embeddedDummycloudIp = "203.0.113.1"; //required for the lo alias approach
    }

    onMessage(msg) {
        switch (msg.method) {
            case "_sync.gen_tmp_presigned_url":
                this.sendCloud({
                    id: msg.id,
                    result: {
                        urls: msg.params.indexes.map(i => {
                            return {
                                url: this.mapUploadUrlPrefix + "/api/miio/map_upload_handler?ts=" + process.hrtime().toString().replace(/,/g, ""),
                                obj_name: process.hrtime().toString().replace(/,/g, "") + "/" + i,
                                method: "PUT",
                                expires_time: Math.floor(new Date(new Date().getTime() + 15*60000).getTime() /1000), //+15min
                            };
                        })
                    }
                });
                return true;

            case "_sync.gen_presigned_url": {
                this.sendCloud({
                    id: msg.id,
                    result: {
                        [msg.params.suffix]: {
                            url: this.mapUploadUrlPrefix + "/api/miio/map_upload_handler?ts=" + process.hrtime(),
                            obj_name: process.hrtime().toString().replace(/,/g, "") + msg.params.suffix,
                            method: "PUT",
                            expires_time: Math.floor(new Date(new Date().getTime() + 15*60000).getTime() /1000), //+15min
                            ok: true,
                            pwd: "helloworld"
                        },
                        ok: true
                    },
                });

                return true;
            }
        }

        return false;
    }

    pollMap() {
        // Guard against multiple concurrent polls.
        if (this.pollingMap) {
            return;
        }

        const now = new Date();
        if (now.getTime() - 600 > this.lastMapPoll.getTime()) {
            this.pollingMap = true;
            this.lastMapPoll = now;

            // Clear pending timeout, since we’re starting a new poll right now.
            if (this.pollMapTimeout) {
                clearTimeout(this.pollMapTimeout);
            }

            this.sendCommand("action",
                {
                    did: this.deviceId,
                    siid: this.miotServices.MAP.SIID,
                    aiid: this.miotServices.MAP.ACTIONS.POLL.AIID,
                    in: [{
                        piid: 2,
                        value: "{\"frame_type\":\"I\"}"
                    }]
                }
            ).then(res => {
                let repollSeconds = 60;

                let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                    attributeClass: stateAttrs.StatusStateAttribute.name
                });

                if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                    repollSeconds = 4;
                }


                this.pollMapTimeout = setTimeout(() => this.pollMap(), repollSeconds * 1000);
            }, err => {
                // ¯\_(ツ)_/¯
            }).finally(() => {
                this.pollingMap = false;
            });
        }
    }

    /**
     * Uploaded dreame Maps are actually base64 strings of zlib compressed data with two characters replaced
     *
     * @param {any} data
     * @returns {Promise<Buffer>}
     */
    preprocessMap(data) {
        const base64String = data.toString().replace(/_/g, "/").replace(/-/g, "+");


        return new Promise((resolve, reject) => {
            zlib.inflate(
                Buffer.from(base64String, "base64"),
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
        });
    }

    parseMap(data) {
        const parsedMap = DreameMapParser.PARSE(data);

        if (parsedMap instanceof ValetudoMap) {
            this.state.map = parsedMap;

            this.emitMapUpdated();
        }

        return this.state.map;
    }

    getManufacturer() {
        return "Dreame Technology Tianjin Co Ltd";
    }


    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}

DreameValetudoRobot.DEVICE_CONF_PATH = "/data/config/miio/device.conf";
DreameValetudoRobot.TOKEN_FILE_PATH = "/data/config/miio/device.token";

DreameValetudoRobot.STATUS_MAP = Object.freeze({
    0: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SEGMENT //TODO: is this correct?
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING //TODO: is this correct?
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    14: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    15: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    17: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    18: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SEGMENT
    },
    19: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
    },
    20: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SPOT
    }
});

DreameValetudoRobot.FAN_SPEEDS = {
    [stateAttrs.IntensityStateAttribute.VALUE.LOW]: 0,
    [stateAttrs.IntensityStateAttribute.VALUE.MEDIUM]: 1,
    [stateAttrs.IntensityStateAttribute.VALUE.HIGH]: 2,
    [stateAttrs.IntensityStateAttribute.VALUE.MAX]: 3
};


module.exports = DreameValetudoRobot;
