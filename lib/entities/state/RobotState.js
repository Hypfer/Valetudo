const ContainerEntity = require("../ContainerEntity");

/**
 * This represents the state of a robot
 */
class RobotState extends ContainerEntity {
    /**
     *
     * @param {object} options 
     * @param {import("../map/ValetudoMap")} options.map 
     * @param {Array<import("./attributes/StateAttribute")>} [options.attributes] 
     * @param {object} [options.metaData] 
     */
    constructor(options) {
        super(options);

        this.map = options.map;

        this.metaData.version = 1;
    }
}

module.exports = RobotState;