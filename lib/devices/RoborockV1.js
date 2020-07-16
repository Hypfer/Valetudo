const Roborock = require("./Roborock");
const NotImplementedError = require("./NotImplementedError");
const entities = require("../entities");

class RoborockV1 extends Roborock {
    detectFanSpeeds(msg_ver) {
        this.fanSpeeds = {
            [entities.state.attributes.FanSpeedStateAttribute.VALUE.MIN]: 1,
            [entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW]: 38,
            [entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM]: 60,
            [entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH]: 75,
            [entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX]: 100,
        };
    }

    /**
     * Set a new timer
     * @param cron {string}
     */
    async addTimer(cron) {
        return await this.sendCommand("set_timer", [[Date.now().toString(),[cron, ["",""]]]], {});
    }

    async savePersistentData(persistantData) {
        throw new NotImplementedError();
    }

    async setLabStatus(flag) {
        throw new NotImplementedError();
    }
}

module.exports = RoborockV1;