const zlib = require("zlib");
const RRMapParser = require("../../RRMapParser");

const MiioValetudoRobot = require("../MiioValetudoRobot");
const entities = require("../../entities");

const stateAttrs = entities.state.attributes;

class RoborockValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param options {object}
     * @param options.config {import("../../Configuration")}
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);
    }

    setEmbeddedPaths() {
        this.deviceConfPath = RoborockValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = RoborockValetudoRobot.TOKEN_FILE_PATH;
    }


    onMessage(msg) {
        switch (msg.method) {
            case "props":
                this.parseAndUpdateState(msg.params);
                this.sendCloud({ id: msg.id, result: "ok" });
                return true;
            case "event.status":
                if (msg.params &&
                    msg.params[0] &&
                    msg.params[0].state !== undefined
                ) {
                    this.parseAndUpdateState(msg.params[0]);

                    let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.StatusStateAttribute.name
                    });

                    if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                        this.pollMap();
                    }
                }
                this.sendCloud({ id: msg.id, result: "ok" });
                return true;
            case "_sync.getctrycode":
                this.sendCloud({
                    id: msg.id, result: { ctry_code: "DE" } //TODO
                });
                return true;
            case "_sync.getAppData":
                this.sendCloud({
                    id: msg.id,
                    error: {
                        code: -6,
                        message: "not set app data"
                    }
                });
                return true;
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url":
            case "_sync.batch_gen_room_up_url": {
                let mapUploadUrls = [];
                for (let i = 0; i < 4; i++) {
                    mapUploadUrls.push(
                        this.mapUploadUrlPrefix +
                        "/api/miio/map_upload_handler?" +
                        process.hrtime().toString().replace(/,/g, "")
                    );
                }
                this.sendCloud({ id: msg.id, result: mapUploadUrls });
                return true;
            }
            case "event.back_to_dock": //TODO
            case "event.error_code":
            case "event.bin_full": //TODO: bring to UI
            case "event.relocate_failed_back":
            case "event.goto_target_succ":
            case "event.target_not_reachable":
            case "event.consume_material_notify":
            case "event.segment_map_done":
            case "event.clean_complete":
            case "event.low_power_back": //If the robot is currently cleaning and the battery drops below 20% it drives home to charge
                this.sendCloud({ id: msg.id, result: "ok" });
                return true;
        }
        return false;
    }

    async pollState() {
        const response = await this.sendCommand("get_status", {});

        if (response) {
            this.parseAndUpdateState(response[0]);
        }

        return this.state;
    }


    //TODO: viomi repolls the map on status change to quick poll states. We probably should do the same
    parseAndUpdateState(data) {
        let newStateAttr;

        if (data["state"] !== undefined && STATUS_MAP[data["state"]]) {
            let statusValue = STATUS_MAP[data["state"]].value;
            let statusFlag = STATUS_MAP[data["state"]].flag;
            let statusMetaData = {};

            if (
                data["in_cleaning"] !== 0 &&
                (
                    statusValue === stateAttrs.StatusStateAttribute.VALUE.PAUSED ||
                    statusValue === stateAttrs.StatusStateAttribute.VALUE.RETURNING ||
                    statusValue === stateAttrs.StatusStateAttribute.VALUE.DOCKED
                )
            ) {
                statusFlag = stateAttrs.StatusStateAttribute.FLAG.RESUMABLE;

                if (data["in_cleaning"] === 2) {
                    //Since this is some roborock-related weirdness, we're using the metaData to store this
                    statusMetaData.zoned = true;
                } else if (data["in_cleaning"] === 3) {
                    statusMetaData.segment_cleaning = true;
                }
            } else if (statusValue === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                statusMetaData.error_code = data["error_code"];
                statusMetaData.error_description = GET_ERROR_CODE_DESCRIPTION(data["error_code"]);
            }

            newStateAttr = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData
            });

            this.state.upsertFirstMatchingAttribute(newStateAttr);
        }

        if (data["battery"] !== undefined) {
            let previousBatteryAttr = this.state.getFirstMatchingAttributeByConstructor(stateAttrs.BatteryStateAttribute);
            let flag = stateAttrs.BatteryStateAttribute.FLAG.NONE;
            let level = data["battery"] || 0;


            if (newStateAttr) {
                if (newStateAttr.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED) {
                    if (level === 100) {
                        flag = stateAttrs.BatteryStateAttribute.FLAG.CHARGED;
                    } else {
                        flag = stateAttrs.BatteryStateAttribute.FLAG.CHARGING;
                    }
                } else {
                    flag = stateAttrs.BatteryStateAttribute.FLAG.DISCHARGING;
                }
            } else if (previousBatteryAttr) {
                flag = previousBatteryAttr.flag;
            }

            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                level: level,
                flag: flag
            }));
        }

        if (data["clean_area"] !== undefined) { //TODO: actually not an attribute. Use Job
            this.state.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.AREA,
                value: Math.round(parseInt(data["clean_area"]) / 100)
            }));
        }

        if (data["clean_time"] !== undefined) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.DURATION,
                value: data["clean_time"]
            }));
        }

        //TODO: Move to S5 Implementation
        let persistentMapSetting = stateAttrs.PersistentMapSettingStateAttribute.VALUE.DISABLED;
        if (data["lab_status"] === 1) {
            persistentMapSetting = stateAttrs.PersistentMapSettingStateAttribute.VALUE.ENABLED;
        }

        this.state.upsertFirstMatchingAttribute(new stateAttrs.PersistentMapSettingStateAttribute({
            value: persistentMapSetting
        }));

        //data["dnd_enabled"]
        //data["map_present"]
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

            this.sendCloud({"method": "get_map_v1"}).then(res => {
                if (Array.isArray(res) && res.length === 1) {
                    let repollSeconds = 60;

                    let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.StatusStateAttribute.name
                    });

                    if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                        repollSeconds = 2;
                    }

                    if (res && res[0] === "retry") {
                        repollSeconds += 1;
                    }

                    setTimeout(() => this.pollMap(), repollSeconds * 1000);
                }
            }, err => {
                // ¯\_(ツ)_/¯
            }).finally(() => {
                this.pollingMap = false;
            });
        }

        this.pollMapTimeout = setTimeout(() => this.pollMap(), 5 * 60 * 1000); // 5 minutes
    }

    preprocessMap(data) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, result) => err ? reject(err) : resolve(result));
        });
    }

    parseMap(data) {
        this.state.map = RRMapParser.PARSE(data);

        this.emitMapUpdated();
        return this.state.map;
    }

    getManufacturer() {
        return "Beijing Roborock Technology Co., Ltd.";
    }
}

RoborockValetudoRobot.DEVICE_CONF_PATH = "/mnt/default/device.conf";
RoborockValetudoRobot.TOKEN_FILE_PATH = "/mnt/data/miio/device.token";


/** Device specific status code mapping. */
const STATUS_MAP = {
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SPOT
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    14: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    15: {
        //This confuses the map polling

        //Before, it was known as DOCKING.
        //Recently however, roborock started transparently mapping this to code 6
        //Why? Idk.
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING,
        flag: stateAttrs.StatusStateAttribute.FLAG.TARGET
    },
    17: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
    },
    18: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SECTION
    },
    100: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    101: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    }
};

const ERROR_CODES = {
    0: "No error",
    1: "Laser distance sensor error",
    2: "Collision sensor error",
    3: "Wheels on top of void, move robot",
    4: "Clean hovering sensors, move robot",
    5: "Clean main brush",
    6: "Clean side brush",
    7: "Main wheel stuck?",
    8: "Device stuck, clean area",
    9: "Dust collector missing",
    10: "Clean filter",
    11: "Stuck in magnetic barrier",
    12: "Low battery",
    13: "Charging fault",
    14: "Battery fault",
    15: "Wall sensors dirty, wipe them",
    16: "Place me on flat surface",
    17: "Side brushes problem, reboot me",
    18: "Suction fan problem",
    19: "Unpowered charging station",
    24: "Inside No-Go Area"
};

const GET_ERROR_CODE_DESCRIPTION = (errorCodeId) => {
    if (ERROR_CODES[errorCodeId] !== undefined) {
        return ERROR_CODES[errorCodeId];
    } else {
        return "UNKNOWN ERROR CODE";
    }
};

module.exports = RoborockValetudoRobot;