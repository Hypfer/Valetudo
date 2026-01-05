const capabilities = require("./capabilities");
const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaModernValetudoRobot = require("./MideaModernValetudoRobot");
const MideaQuirkFactory = require("./MideaQuirkFactory");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");

class MideaJ12UltraValetudoRobot extends MideaModernValetudoRobot {
    constructor(options) {
        super(
            Object.assign(
                {},
                options,
                {
                    oldMapPollStyle: true
                }
            )
        );

        const quirkFactory = new MideaQuirkFactory({
            robot: this
        });

        [
            capabilities.MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV2,
            capabilities.MideaCarpetModeControlCapabilityV2,
            capabilities.MideaCarpetSensorModeControlCapabilityV1,
            capabilities.MideaMopTwistControlCapabilityV1,
            capabilities.MideaMopDockMopDryingTimeControlCapability,
            capabilities.MideaAutoEmptyDockAutoEmptyDurationControlCapabilityV2,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_MOP_CLEANING_FREQUENCY),
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.MOP_DOCK_WATER_USAGE),
            ]
        }));
    }

    getManufacturer() {
        return "Eureka";
    }

    getModelName() {
        return "J12 Ultra";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        let sn8;

        try {
            sn8 = fs.readFileSync("/oem/midea/device.sn8").toString().trim();
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", "/oem/midea/device.sn8", e);
        }

        return ["750Y000D", "750Y000J"].includes(sn8);
    }
}

module.exports = MideaJ12UltraValetudoRobot;
