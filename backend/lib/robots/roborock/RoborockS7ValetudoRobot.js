const capabilities = require("./capabilities");
const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const RoborockGen4ValetudoRobot = require("./RoborockGen4ValetudoRobot");
const RoborockQuirkFactory = require("./RoborockQuirkFactory");
const RoborockValetudoRobot = require("./RoborockValetudoRobot");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");

class RoborockS7ValetudoRobot extends RoborockGen4ValetudoRobot {
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
            capabilities.RoborockKeyLockCapability,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        const quirkFactory = new RoborockQuirkFactory({
            robot: this
        });
        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.BUTTON_LEDS),
                quirkFactory.getQuirk(RoborockQuirkFactory.KNOWN_QUIRKS.STATUS_LED)
            ]
        }));
    }

    getModelName() {
        return "S7";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(RoborockValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && (deviceConf.model === "roborock.vacuum.a14" || deviceConf.model === "roborock.vacuum.a15"));
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


module.exports = RoborockS7ValetudoRobot;
