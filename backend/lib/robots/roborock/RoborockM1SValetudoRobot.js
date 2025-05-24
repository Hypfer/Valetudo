const capabilities = require("./capabilities");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");


class RoborockM1SValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(Object.assign({}, options, {fanSpeeds: FAN_SPEEDS}));

        [
            capabilities.RoborockMapSnapshotCapability,
            capabilities.RoborockCombinedVirtualRestrictionsCapability,
            capabilities.RoborockPersistentMapControlCapability,
            capabilities.RoborockMapResetCapability,
            capabilities.RoborockMapSegmentSimpleCapability,
            capabilities.RoborockMapSegmentEditCapability,
            capabilities.RoborockMapSegmentRenameCapability,
            capabilities.RoborockHighResolutionManualControlCapability
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });
    }

    setEmbeddedParameters() {
        this.deviceConfPath = RoborockM1SValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = RoborockM1SValetudoRobot.TOKEN_FILE_PATH;
    }

    getModelName() {
        return "M1S";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.m1s");
    }
}

RoborockM1SValetudoRobot.DEVICE_CONF_PATH = "/mnt/default/device.conf";
RoborockM1SValetudoRobot.TOKEN_FILE_PATH = "/data/miio/device.token";

const FAN_SPEEDS = {
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.LOW]: 101,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 102,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.HIGH]: 103,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MAX]: 104,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.OFF] : 105 //also known as mop mode
};

module.exports = RoborockM1SValetudoRobot;
