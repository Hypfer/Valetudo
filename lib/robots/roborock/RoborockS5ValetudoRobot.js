const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const capabilities = require("./capabilities");
const FanSpeedPreset = require("../../entities/core/ValetudoFanSpeedPreset");
const entities = require("../../entities");

const stateAttrs = entities.state.attributes;



class RoborockS5ValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(options);

        this.registerCapability(new capabilities.RoborockFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(FAN_SPEEDS).map(k => new FanSpeedPreset({name: k, value: FAN_SPEEDS[k]}))
        }));
        this.registerCapability(new capabilities.RoborockMapSnapshotCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockCombinedVirtualRestrictionsCapability({
            robot: this
        }));
    }

    parseAndUpdateState(data) {
        super.parseAndUpdateState(data);

        if (data["fan_power"] !== undefined) {
            let matchingFanSpeed = Object.keys(FAN_SPEEDS).find(key => FAN_SPEEDS[key] === data["fan_power"]);
            if (!matchingFanSpeed) {
                matchingFanSpeed = stateAttrs.FanSpeedStateAttribute.VALUE.CUSTOM;
            }

            this.state.upsertFirstMatchingAttribute(new stateAttrs.FanSpeedStateAttribute({
                value: matchingFanSpeed,
                customValue: matchingFanSpeed === stateAttrs.FanSpeedStateAttribute.VALUE.CUSTOM ? data["fan_power"] : undefined
            }));
        }

        this.emitStateUpdated();
    }


    getModelName() {
        return "S5";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.s5");
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW]: 101,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM]: 102,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH]: 103,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX]: 104,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.OFF] : 105 //also known as mop mode
};

module.exports = RoborockS5ValetudoRobot;