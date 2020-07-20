const Roborock = require("./Roborock");
const RRMapParser = require("../RRMapParser");
const NotImplementedError = require("./NotImplementedError");
const entities = require("../entities");

class RoborockS5 extends Roborock {
    constructor(options) {
        super(options);

        /**
         * Distinguish between Gen3 and older firmware to adapt commands like addTimer.
         *
         * @protected
         */
        this.isGen3 = false;
    }

    parseStatus(res) {
        this.isGen3 = res["msg_ver"] >= 3;
        super.parseStatus(res);
    }

    detectFanSpeeds(msg_ver) {
        let fanSpeeds = {};

        fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.OFF] = 105; //also known as mop mode
        fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.MIN] = 1;
        fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW] = 38;
        fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM] = 60;
        fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH] = 75;
        fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX] = 100;

        if (msg_ver >= 3) {
            delete fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.MIN];

            fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW] = 101;
            fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM] = 102;
            fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH] = 103;
            fanSpeeds[entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX] = 104;
        }


        this.fanSpeeds = fanSpeeds;
    }

    /**
     * Set a new timer
     *
     * @param {string} cron
     */
    async addTimer(cron) {
        if (this.isGen3) {
            await this.sendCommand("set_timer", [[Date.now().toString(),
                [cron, ["start_clean", {"fan_power": 102, "segments": "", "repeat": 1, "clean_order_mode": 1}]] //TODO: why is this hardcoded to medium?
            ]], {});
        } else {
            // older firmware don’t take arguments for set_timer
            await this.sendCommand("set_timer", [[Date.now().toString(), [cron, ["", ""]]]], {});
        }
    }

    /**
     * Sets the lab status aka persistent data feature of the S50
     *
     * @param {boolean} flag true for enabling lab mode and false for disabling
     */
    async setLabStatus(flag) {
        const labStatus = flag ? 1 : 0;
        await this.sendCommand("set_lab_status", [labStatus], {});
    }

    /**
     * Saves the persistent data like virtual walls and nogo zones
     * They have to be provided in the following format:
     *      https://github.com/marcelrv/XiaomiRobotVacuumProtocol/issues/15#issuecomment-447647905
     *      Software barrier takes a vector of [id, x1,y1,x2,y2]
     *      And no-go zone takes [id, x1,y1,x2,y2,x3,y3,x4,y4], which are the corners of the zone rectangle?
     *      Edit: see @JensBuchta's comment. The first parameter appears to be a type: 0 = zone, 1 = barrier
     *
     * @param {any} persistantData
     */
    async savePersistentData(persistantData) { //TODO: Store in valetudo config
        if (Array.isArray(persistantData)) {
            const flippedYCoordinates = persistantData.map(data => {
                if (data[0] === PERSISTENT_DATA_TYPES.ZONE) {
                    // this is a zone
                    return [
                        data[0],
                        data[1] * 10,
                        RRMapParser.DIMENSION_MM - data[2] * 10,
                        data[3] * 10,
                        RRMapParser.DIMENSION_MM - data[4] * 10,
                        data[5] * 10,
                        RRMapParser.DIMENSION_MM - data[6] * 10,
                        data[7] * 10,
                        RRMapParser.DIMENSION_MM - data[8] * 10
                    ];
                } else {
                    return [
                        data[0],
                        data[1] * 10,
                        RRMapParser.DIMENSION_MM - data[2] * 10,
                        data[3] * 10,
                        RRMapParser.DIMENSION_MM - data[4] * 10,
                    ];
                }
            });

            if (flippedYCoordinates.reduce((total, currentElem) => {
                return total += currentElem[0] === PERSISTENT_DATA_TYPES.ZONE ? 4 : 2;
            }, 0) > 68) {
                throw new Error("too many forbidden markers to save!");
            }


            this.sendCommand("save_map", flippedYCoordinates, {timeout: 3500}).finally(() => {
                this.pollMap();
            });
        } else {
            throw new Error("persistantData has to be an array.");
        }
    }


    async getBackupMaps() {
        if (this.isGen3) {
            const response = await this.sendCommand("get_recover_maps", [], {});

            return response.map(e => {
                return {id: e[0], timestamp: new Date(e[1] * 1000)};
            });
        } else {
            throw new NotImplementedError();
        }
    }

    async restoreBackupMap(backupMap) {
        if (this.isGen3) {
            return this.sendCommand("recover_map", [backupMap.id]);
        } else {
            throw new NotImplementedError();
        }

    }
}

/** @enum {number} */
const PERSISTENT_DATA_TYPES = {
    "ZONE": 0,
    "BARRIER": 1
};

module.exports = RoborockS5;