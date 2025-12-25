const BEightParser = require("../../msmart/BEightParser");
const capabilities = require("./capabilities");
const dtos = require("../../msmart/dtos");
const fs = require("node:fs");
const LinuxWifiScanCapability = require("../common/linuxCapabilities/LinuxWifiScanCapability");
const Logger = require("../../Logger");
const MideaModernValetudoRobot = require("./MideaModernValetudoRobot");
const MideaQuirkFactory = require("./MideaQuirkFactory");
const MissingResourceValetudoEvent = require("../../valetudo_events/events/MissingResourceValetudoEvent");
const MSmartConst = require("../../msmart/MSmartConst");
const MSmartPacket = require("../../msmart/MSmartPacket");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");
const {IMAGE_FILE_FORMAT} = require("../../utils/const");

class MideaJ15MaxUltraValetudoRobot extends MideaModernValetudoRobot {
    constructor(options) {
        super(
            Object.assign(
                {},
                options,
                {
                    waterGrades: MideaJ15MaxUltraValetudoRobot.HIGH_RESOLUTION_WATER_GRADES,
                }
            )
        );

        const quirkFactory = new MideaQuirkFactory({
            robot: this
        });

        [
            capabilities.MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV3,
            capabilities.MideaMopExtensionControlCapability,
            capabilities.MideaCameraLightControlCapability,
            capabilities.MideaObstacleAvoidanceControlCapability,
            capabilities.MideaMopDockMopWashTemperatureControlCapability,
            capabilities.MideaCarpetSensorModeControlCapabilityV2,
            capabilities.MideaPetObstacleAvoidanceControlCapability,
            capabilities.MideaMopTwistControlCapabilityV2,
            capabilities.MideaMopExtensionFurnitureLegHandlingControlCapability,
            capabilities.MideaCollisionAvoidantNavigationControlCapability,
            capabilities.MideaCarpetModeControlCapabilityV3,
            capabilities.MideaMapSegmentMaterialControlCapability,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new capabilities.MideaObstacleImagesCapability({
            robot: this,
            fileFormat: IMAGE_FILE_FORMAT.JPG,
            dimensions: {
                width: 800,
                height: 600
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
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WATER_USAGE),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.MOP_DRYING_TIME),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_SELF_CLEANING_FREQUENCY),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.CLEAN_ROUTE),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.THRESHOLD_RECOGNITION),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.BRIDGE_BOOST),
            ]
        }));

        if (this.config.get("embedded") === true) {
            this.registerCapability(new LinuxWifiScanCapability({
                robot: this,
                networkInterface: "wlan0"
            }));
        }

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

    async executeMapPoll() {
        await super.executeMapPoll();

        const activeSegmentsPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_ACTIVE_SEGMENTS)
        });

        const activeSegmentsResponse = await this.sendCommand(activeSegmentsPollPacket.toHexString());
        const parsedActiveSegmentsResponse = BEightParser.PARSE(activeSegmentsResponse);

        if (parsedActiveSegmentsResponse instanceof dtos.MSmartActiveSegmentsDTO) {
            await this.handleMapUpdate("evt_active_segments", parsedActiveSegmentsResponse);
        }
    }

    getManufacturer() {
        return "Eureka";
    }

    getModelName() {
        return "J15 Max Ultra";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        let sn8;

        try {
            sn8 = fs.readFileSync("/oem/midea/device.sn8").toString().trim();
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", "/oem/midea/device.sn8", e);
        }

        return ["750Y0014", "750Y0013"].includes(sn8);
    }
}

module.exports = MideaJ15MaxUltraValetudoRobot;
