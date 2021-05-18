const Logger = require("../Logger");
const Robots = require("../robots");

class ValetudoRobotFactory {
    /**
     * Takes the config and returns the correct robot implementation
     * If config is set to auto and we're embedded, it will autodetect the correct implementation
     * Otherwise it will trow
     *
     * @param {import("../Configuration")} config
     */
    static getRobotImplementation(config) {
        const robotConfig = config.get("robot");

        if (robotConfig.implementation === "auto") {
            if (config.get("embedded") === true) {
                return ValetudoRobotFactory.autodetectRobotImplementation();
            } else {
                throw new Error("Implementation \"auto\" only works in embedded mode.");
            }
        } else {
            if (Robots[robotConfig.implementation]) {
                return Robots[robotConfig.implementation];
            } else {
                throw new Error("Couldn't find implementation \"" + robotConfig.implementation + "\"");
            }
        }
    }

    /**
     * This fuction calls every robot implementations IMPLEMENTATION_AUTO_DETECTION_HANDLER to
     * determine the correct implementation
     *
     * It will throw when there is none
     */
    static autodetectRobotImplementation() {
        let matchedImplementation;

        Object.keys(Robots).some(k => {
            if (Robots[k].IMPLEMENTATION_AUTO_DETECTION_HANDLER()) {
                matchedImplementation = Robots[k];

                Logger.info("Autodetected " + k);
                return true;
            } else {
                return false;
            }
        });

        if (matchedImplementation) {
            return matchedImplementation;
        } else {
            throw new Error("Couldn't find a suitable ValetudoRobot implementation.");
        }
    }
}

module.exports = ValetudoRobotFactory;
