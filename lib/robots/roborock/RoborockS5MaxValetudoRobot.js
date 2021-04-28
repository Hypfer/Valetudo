const capabilities = require("./capabilities");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");

class RoborockS5MaxValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(Object.assign({}, options, {fanSpeeds: FAN_SPEEDS, waterGrades: WATER_GRADES}));

        this.registerCapability(new capabilities.RoborockMapSnapshotCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.RoborockCombinedVirtualRestrictionsCapability({
            robot: this,
            supportedRestrictedZoneTypes: [
                ValetudoRestrictedZone.TYPE.REGULAR,
                ValetudoRestrictedZone.TYPE.MOP
            ]
        }));
        this.registerCapability(new capabilities.RoborockMultiMapPersistentMapControlCapability({
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

        this.registerCapability(new capabilities.RoborockWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => new entities.core.ValetudoSelectionPreset({name: k, value: this.waterGrades[k]}))
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
        return "S5 Max";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.s5e");
    }
}

const FAN_SPEEDS = {
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.LOW]: 101,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.MEDIUM]: 102,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.HIGH]: 103,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.MAX]: 104,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.OFF] : 105 //also known as mop mode
};

const WATER_GRADES = {
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.OFF] : 200,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.LOW]: 201,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.MEDIUM]: 202,
    [entities.state.attributes.PresetSelectionStateAttribute.VALUE.HIGH]: 203
};

module.exports = RoborockS5MaxValetudoRobot;
