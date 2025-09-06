const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");
const PointMapEntity = require("../../../entities/map/PointMapEntity");

/**
 * @extends ManualControlCapability<import("../MockValetudoRobot")>
 */
class MockManualControlCapability extends ManualControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     * @class
     */
    constructor(options) {
        super(Object.assign({}, options, {
            supportedMovementCommands: [
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE
            ]
        }));

        this.active = false;
    }

    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        this.active = true;
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        this.active = false;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async manualControlActive() {
        return this.active;
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").MOVEMENT_COMMAND_TYPE} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        if (!this.active) {
            throw new Error("Manual control mode is not active.");
        }
        const map = this.robot.state.map;
        const robotEntity = map.entities.find(e => {
            return e.type === PointMapEntity.TYPE.ROBOT_POSITION;
        });

        let position = [...robotEntity.points];
        let angle = robotEntity.metaData.angle;

        switch (movementCommand) {
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD:
                position[0] += Math.cos((angle - 90) * Math.PI / 180) * map.pixelSize * 30;
                position[1] += Math.sin((angle - 90) * Math.PI / 180) * map.pixelSize * 30;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD:
                position[0] -= Math.cos((angle - 90) * Math.PI / 180) * map.pixelSize * 30;
                position[1] -= Math.sin((angle - 90) * Math.PI / 180) * map.pixelSize * 30;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE:
                angle += 30;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE:
                angle -= 30;
                break;
            default:
                throw new Error("Invalid movementCommand.");
        }

        setTimeout(() => {
            robotEntity.points = position;
            robotEntity.metaData.angle = angle;
            this.robot.emitMapUpdated();
        }, 250);
    }
}

module.exports = MockManualControlCapability;
