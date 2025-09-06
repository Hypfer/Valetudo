const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaValetudoRobot = require("./MideaValetudoRobot");

class MideaJ15ProUltraValetudoRobot extends MideaValetudoRobot {
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
