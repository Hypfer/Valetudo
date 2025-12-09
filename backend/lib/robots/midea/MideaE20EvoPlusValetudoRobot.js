const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaE20ValetudoRobot = require("./MideaE20ValetudoRobot");

class MideaE20EvoPlusValetudoRobot extends MideaE20ValetudoRobot {
    getModelName() {
        return "E20 Evo Plus";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        let sn8;

        try {
            sn8 = fs.readFileSync("/oem/midea/device.sn8").toString().trim();
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", "/oem/midea/device.sn8", e);
        }

        return ["750Y0015"].includes(sn8);
    }
}

module.exports = MideaE20EvoPlusValetudoRobot;
