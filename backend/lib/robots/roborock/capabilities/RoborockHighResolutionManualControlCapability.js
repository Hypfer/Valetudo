const HighResolutionManualControlCapability = require("../../../core/capabilities/HighResolutionManualControlCapability");

/**
 * @extends HighResolutionManualControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockHighResolutionManualControlCapability extends HighResolutionManualControlCapability {
    /**
     *
     * @param {object} options
     * @param {number} [options.velocityLimit] 
     * @param {import("../RoborockValetudoRobot")} options.robot
     * @class
     */
    constructor(options) {
        super(options);

        this.sequenceId = 0;
        this.active = false;

        /**
         * According to user reports, the Roborock V1 doesn't like velocities >= (-)0.3
         * They work fine with the S5 and newer(?) but get ignored by the V1 firmware
         * causing it to not move at all.
         */
        this.velocityLimitPos = options.velocityLimit ?? 1;
        this.velocityLimitNeg = this.velocityLimitPos * -1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        this.sequenceId = 0;
        this.active = true;

        return this.robot.sendCommand("app_rc_start", [], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        this.sequenceId = 0;
        this.active = false;

        return this.robot.sendCommand("app_rc_end", [], {});
    }

    /**
     * @returns {Promise<boolean>}
     */
    async manualControlActive() {
        return this.active;
    }

    /**
     * @param {import("../../../entities/core/ValetudoManualMovementVector")} vector
     * @returns {Promise<void>}
     */
    async manualControl(vector) {
        const omega = (vector.angle * (Math.PI / 180) * -1);
        let velocity = vector.velocity / 2.5; // -0.4 to 0.4
        velocity = Math.max(this.velocityLimitNeg, velocity);
        velocity = Math.min(this.velocityLimitPos, velocity);

        return this.robot.sendCommand("app_rc_move", [{
            omega: omega,
            velocity: velocity,
            seqnum: ++this.sequenceId
        }], {});
    }
}

module.exports = RoborockHighResolutionManualControlCapability;
