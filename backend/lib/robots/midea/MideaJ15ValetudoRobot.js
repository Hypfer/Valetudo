const fs = require("node:fs");
const Logger = require("../../Logger");
const MideaValetudoRobot = require("./MideaValetudoRobot");

class MideaJ15ValetudoRobot extends MideaValetudoRobot {
    getManufacturer() {
        return "Eureka";
    }

    getModelName() {
        return "J15 Pro Ultra"; // TODO: how do you distinguish the ultra from the pro ultra? And what about the max?
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        let productModel;

        try {
            productModel = fs.readFileSync("/oem/product/product_model").toString().trim();
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", "/oem/product/product_model", e);
        }

        return !!(productModel && productModel === "j15_eureka");
    }
}

module.exports = MideaJ15ValetudoRobot;
