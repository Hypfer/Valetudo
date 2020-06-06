const RoborockS5 = require("./RoborockS5");
const MiioVacuum = require("./MiioVacuum");

/*
    This class is a hackish way to support S6/S5 Max without changing much of the code
    The correct way to do this would be a feature component system
 */
class RoborockGen3 extends RoborockS5 {
    constructor(options) {
        super(options);

        //These are always gen3
        this.isGen3 = true;
    }

    parseStatus(res) {
        super.parseStatus(res);
        this.isGen3 = true;
    }

    detectFanSpeeds(msg_ver) {
        /** @type {{[id: string]: {label: string, value: number}}} */
        const fanSpeeds = {};

        fanSpeeds[MiioVacuum.FAN_SPEEDS.LOW] = {label: "Silent", value: 38};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MEDIUM] = {label: "Normal", value: 60};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.HIGH] = {label: "Turbo", value: 75};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MAX] = {label: "Max", value: 100};
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MOP] = {label: "Mop", value: 105};

        fanSpeeds[MiioVacuum.FAN_SPEEDS.LOW].value = 101;
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MEDIUM].value = 102;
        fanSpeeds[MiioVacuum.FAN_SPEEDS.HIGH].value = 103;
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MAX].value = 104;
        fanSpeeds[MiioVacuum.FAN_SPEEDS.MOP].value = 105;

        this.fanSpeeds = fanSpeeds;
    }

}

module.exports = RoborockGen3;