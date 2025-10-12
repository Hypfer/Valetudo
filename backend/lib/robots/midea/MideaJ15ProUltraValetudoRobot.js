const capabilities = require("./capabilities");
const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaQuirkFactory = require("./MideaQuirkFactory");
const MideaValetudoRobot = require("./MideaValetudoRobot");
const MissingResourceValetudoEvent = require("../../valetudo_events/events/MissingResourceValetudoEvent");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const {IMAGE_FILE_FORMAT} = require("../../utils/const");

class MideaJ15ProUltraValetudoRobot extends MideaValetudoRobot {
    constructor(options) {
        super(
            Object.assign(
                {},
                options,
                {
                    waterGrades: MideaJ15ProUltraValetudoRobot.HIGH_RESOLUTION_WATER_GRADES,
                }
            )
        );

        const quirkFactory = new MideaQuirkFactory({
            robot: this
        });

        [
            capabilities.MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV2,
            capabilities.MideaMopExtensionControlCapability,
            capabilities.MideaCameraLightControlCapability,
            capabilities.MideaObstacleAvoidanceControlCapability,
            capabilities.MideaMopDockMopWashTemperatureControlCapability,
            capabilities.MideaCarpetSensorModeControlCapabilityV2,
            capabilities.MideaPetObstacleAvoidanceControlCapability,
            capabilities.MideaMopTwistControlCapabilityV2,
            capabilities.MideaMopExtensionFurnitureLegHandlingControlCapability,
            capabilities.MideaCollisionAvoidantNavigationControlCapability,
            capabilities.MideaCarpetModeControlCapabilityV2
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new capabilities.MideaObstacleImagesCapability({
            robot: this,
            fileFormat: IMAGE_FILE_FORMAT.JPG,
            dimensions: {
                width: 640,
                height: 480
            }
        }));

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.HAIR_CUTTING),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.HAIR_CUTTING_ONE_TIME_TURBO),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.AI_OBSTACLE_CLASSIFICATION),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.QUIET_AUTO_EMPTY),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.CLIFF_SENSORS),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.CARPET_FIRST),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.DEEP_CARPET_CLEANING),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.INCREASED_CARPET_AVOIDANCE),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.STAIN_CLEANING),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_DURATION),
            ]
        }));

        if (this.config.get("embedded") === true) {
            if (!fs.existsSync("/userdata/ai_models/cod-detect-large.bin")) {
                this.valetudoEventStore.raise(new MissingResourceValetudoEvent({
                    id: "midea_ai_model",
                    message: "The large obstacle detection AI model is missing."
                }));
            }
        }
    }

    startup() {
        super.startup();

        if (this.config.get("embedded") === true) {
            let aiModelVersion = "unknown/none";
            try {
                aiModelVersion = fs.readFileSync("/userdata/ai_models/version.txt").toString();
            } catch (e) {
                /* intentional */
            }

            Logger.info(`Obstacle detection AI model version: ${aiModelVersion}`);
        }
    }

    getManufacturer() {
        return "Eureka";
    }

    getModelName() {
        return "J15 Pro Ultra";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        let sn8;

        try {
            sn8 = fs.readFileSync("/oem/midea/device.sn8").toString().trim();
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", "/oem/midea/device.sn8", e);
        }

        return ["750Y000R", "750Y000U","750Y000Y"].includes(sn8);
    }
}

module.exports = MideaJ15ProUltraValetudoRobot;
