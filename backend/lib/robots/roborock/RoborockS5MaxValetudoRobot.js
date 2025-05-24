const capabilities = require("./capabilities");
const entities = require("../../entities");
const fs = require("fs");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const RoborockQuirkFactory = require("./RoborockQuirkFactory");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");

class RoborockS5MaxValetudoRobot extends RoborockValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(
            Object.assign(
                {},
                options,
                {
                    fanSpeeds: FAN_SPEEDS,
                    waterGrades: WATER_GRADES,
                    supportedAttachments: SUPPORTED_ATTACHMENTS
                }
            )
        );

        this.registerCapability(new capabilities.RoborockCombinedVirtualRestrictionsCapability({
            robot: this,
            supportedRestrictedZoneTypes: [
                ValetudoRestrictedZone.TYPE.REGULAR,
                ValetudoRestrictedZone.TYPE.MOP
            ]
        }));

        this.registerCapability(new capabilities.RoborockWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => {
                return new entities.core.ValetudoSelectionPreset({name: k, value: this.waterGrades[k]});
            })
        }));

        [
            capabilities.RoborockMultiMapPersistentMapControlCapability,
            capabilities.RoborockMultiMapMapResetCapability,
            capabilities.RoborockMapSegmentationCapability,
            capabilities.RoborockMapSegmentEditCapability,
            capabilities.RoborockMapSegmentRenameCapability,
            capabilities.RoborockMappingPassCapability,
            capabilities.RoborockHighResolutionManualControlCapability
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        const quirkFactory = new RoborockQuirkFactory({
            robot: this
        });
        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.BUTTON_LEDS)
            ]
        }));
    }

    getModelName() {
        return "S5 Max";
    }

    setEmbeddedParameters() {
        super.setEmbeddedParameters();

        if (fs.existsSync(RESERVE_CONF_PATH)) {
            this.deviceConfPath = RESERVE_CONF_PATH;
        }
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConfPath = fs.existsSync(RESERVE_CONF_PATH) ? RESERVE_CONF_PATH : RoborockValetudoRobot.DEVICE_CONF_PATH;
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(deviceConfPath);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.s5e");
    }
}

// As it should turn out, some of these robots actually have two identities of which the regular one stays unused.
// Roborock added logic in their stock firmware that prioritizes this second device.conf if it exists
// Hence, Valetudo shall do the same
const RESERVE_CONF_PATH = "/mnt/reserve/device.conf";

const FAN_SPEEDS = {
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.LOW]: 101,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 102,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.HIGH]: 103,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MAX]: 104,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.OFF] : 105 //also known as mop mode
};

const WATER_GRADES = {
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.OFF] : 200,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.LOW]: 201,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 202,
    [entities.state.attributes.PresetSelectionStateAttribute.INTENSITY.HIGH]: 203
};

const SUPPORTED_ATTACHMENTS = [
    entities.state.attributes.AttachmentStateAttribute.TYPE.WATERTANK,
    entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
];

module.exports = RoborockS5MaxValetudoRobot;
