const capabilities = require("./capabilities");
const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaQuirkFactory = require("./MideaQuirkFactory");
const MideaValetudoRobot = require("./MideaValetudoRobot");
const QuirksCapability = require("../../core/capabilities/QuirksCapability");

class MideaJ12UltraValetudoRobot extends MideaValetudoRobot {
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
            capabilities.MideaAutoEmptyDockAutoEmptyIntervalControlCapabilityV1,
            capabilities.MideaCarpetModeControlCapabilityV1,
            capabilities.MideaCarpetSensorModeControlCapabilityV1,
            capabilities.MideaMopTwistControlCapabilityV1,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new QuirksCapability({
            robot: this,
            quirks: [
                quirkFactory.getQuirk(MideaQuirkFactory.KNOWN_QUIRKS.AUTO_EMPTY_DURATION),
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
