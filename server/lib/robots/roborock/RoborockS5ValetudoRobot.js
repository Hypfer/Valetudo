const capabilities = require("./capabilities");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");


class RoborockS5ValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(Object.assign({}, options, {fanSpeeds: FAN_SPEEDS}));

        this.registerCapability(new capabilities.RoborockMapSnapshotCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockCombinedVirtualRestrictionsCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockPersistentMapControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapResetCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentationCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentEditCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockMapSegmentRenameCapability({
            robot: this
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.WATERTANK,
            attached: false
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
        }));
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
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.LOW]: 101,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 102,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.HIGH]: 103,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MAX]: 104,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.OFF] : 105 //also known as mop mode
};

module.exports = RoborockS5ValetudoRobot;
