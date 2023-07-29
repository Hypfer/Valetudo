const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");

const capabilities = require("./capabilities");

class DreameGen2LidarValetudoRobot extends DreameGen2ValetudoRobot {
    constructor(options) {
        super(options);

        this.registerCapability(new capabilities.DreameMappingPassCapability({robot: this}));
    }
}


module.exports = DreameGen2LidarValetudoRobot;
