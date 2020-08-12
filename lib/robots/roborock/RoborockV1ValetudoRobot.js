const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const capabilities = require("./capabilities");
const FanSpeedPreset = require("../../entities/core/ValetudoFanSpeedPreset");
const entities = require("../../entities");

const stateAttrs = entities.state.attributes;



class RoborockV1ValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param options {object}
     * @param options.config {import("../../Configuration")}
     */
    constructor(options) {
        super(options);

        this.registerCapability(new capabilities.RoborockBasicControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(FAN_SPEEDS).map(k => new FanSpeedPreset({name: k, value: FAN_SPEEDS[k]}))
        }));
        this.registerCapability(new capabilities.RoborockConsumableMonitoringCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockZoneCleaningCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockGoToLocationCapability({
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
        return "Xiaomi Mi SDJQR02RR";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "rockrobo.vacuum.v1");
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MIN]: 1,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.LOW]: 38,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MEDIUM]: 60,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.HIGH]: 75,
    [entities.state.attributes.FanSpeedStateAttribute.VALUE.MAX]: 100
};

module.exports = RoborockV1ValetudoRobot;