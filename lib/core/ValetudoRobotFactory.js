const Logger = require("../Logger");

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

const Robots = {
    "RoborockV1ValetudoRobot": require("../robots/roborock/RoborockV1ValetudoRobot"),
    "RoborockS5ValetudoRobot": require("../robots/roborock/RoborockS5ValetudoRobot"),
    "RoborockS6ValetudoRobot": require("../robots/roborock/RoborockS6ValetudoRobot"),
    "RoborockS4ValetudoRobot": require("../robots/roborock/RoborockS4ValetudoRobot"),
    "RoborockS6PureValetudoRobot": require("../robots/roborock/RoborockS6PureValetudoRobot"),
    "RoborockS4MaxValetudoRobot": require("../robots/roborock/RoborockS4MaxValetudoRobot"),
    "RoborockS5MaxValetudoRobot": require("../robots/roborock/RoborockS5MaxValetudoRobot"),
    "RoborockS6MaxVValetudoRobot": require("../robots/roborock/RoborockS6MaxVValetudoRobot"),
    "Dreame1CValetudoRobot": require("../robots/dreame/Dreame1CValetudoRobot"),
    "DreameD9ValetudoRobot": require("../robots/dreame/DreameD9ValetudoRobot"),
    "ViomiV7ValetudoRobot": require("../robots/viomi/ViomiV7ValetudoRobot")
};

//This is only exported so that we can autogenerate the supported robots overview for the docs
ValetudoRobotFactory.Robots = Robots;

module.exports = ValetudoRobotFactory;
