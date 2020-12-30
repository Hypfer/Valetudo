const ContainerEntity = require("../ContainerEntity");

/**
 * This represents the state of a robot
 *
 * The Robots state is mostly defined through its attributes.
 * Attributes can be added/updated or removed. E.g. when inserting the
 * dustbin, we’d add the AttachmentStateAttribute({type: "dustbin"})
 * and remove it when the dustbin is removed.
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
