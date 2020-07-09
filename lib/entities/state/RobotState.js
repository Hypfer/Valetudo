const ContainerEntity = require("../ContainerEntity");

/**
 * This represents the state of a robot
 */
class RobotState extends ContainerEntity {
    /**
     *
     * @param options {object}
     * @param options.map {import("../map/ValetudoMap")}
     * @param [options.attributes] {Array<import("./attributes/StateAttribute")>}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.map = options.map;

        this.metaData.version = 1;
    }
}

module.exports = RobotState;