const Roborock = require("./Roborock");
const MiioVacuum = require("./MiioVacuum");
const NotImplementedError = require("./NotImplementedError");

class RoborockV1 extends Roborock {
    detectFanSpeeds(msg_ver) {
        /** @type {{[id: string]: {label: string, value: number}}} */
        let fanSpeeds = {};

        fanSpeeds[MiioVacuum.FAN_SPEEDS.MIN] = {label: "Min", value: 1};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.LOW] = {label: "Silent", value: 38};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MEDIUM] = {label: "Normal", value: 60};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.HIGH] = {label: "Turbo", value: 75};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MAX] = {label: "Max", value: 100};

        this.fanSpeeds = fanSpeeds;
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