const capabilities = require("./capabilities");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const RoborockConst = require("./RoborockConst");
const RoborockGen4ValetudoRobot = require("./RoborockGen4ValetudoRobot");
const RoborockQuirkFactory = require("./RoborockQuirkFactory");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");


class RoborockS7ProUltraValetudoRobot extends RoborockGen4ValetudoRobot {
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
                    waterGrades: WATER_GRADES,
                    supportedAttachments: SUPPORTED_ATTACHMENTS,
                    dockType: RoborockConst.DOCK_TYPE.ULTRA
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

        this.registerCapability(new capabilities.RoborockCarpetSensorModeControlCapability({
            robot: this,
            liftModeId: 1
        }));

        [
            capabilities.RoborockAutoEmptyDockAutoEmptyControlCapability,
            capabilities.RoborockAutoEmptyDockManualTriggerCapability,
            capabilities.RoborockMopDockCleanManualTriggerCapability,
            capabilities.RoborockKeyLockCapability,
            capabilities.RoborockMappingPassCapability
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        const quirkFactory = new RoborockQuirkFactory({
            robot: this
        });
        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_DURATION),
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_MODE),
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY),
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.BUTTON_LEDS),
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.MOP_PATTERN),
            ]
        }));
    }

    getModelName() {
        return "S7 Pro Ultra";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "roborock.vacuum.a62");
    }
}

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


module.exports = RoborockS7ProUltraValetudoRobot;
