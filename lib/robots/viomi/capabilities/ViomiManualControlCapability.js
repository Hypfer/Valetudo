const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");
const stateAttrs = require("../../../entities/state/attributes");
const ViomiManualControlDirection = require("../ViomiCommonAttributes").ViomiManualControlDirection;


class ViomiManualControlCapability extends ManualControlCapability {
    /**
     * @private
     * @param {number} direction
     * @returns {Promise<void>}
     */
    async viomiMove(direction) {
        await this.robot.sendCommand("set_direction", [direction]);
    }

    /**
     * @private
     * @returns {boolean}
     */
    isInManualControlMode() {
        const state = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);
        return !!(state && state.value === stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL);
    }

    /**
     * @returns {Promise<void>}
     */
    async enterManualControl() {
        if (!this.isInManualControlMode()) {
            await this.viomiMove(ViomiManualControlDirection.ENTER_EXIT);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async leaveManualControl() {
        if (this.isInManualControlMode()) {
            await this.viomiMove(ViomiManualControlDirection.ENTER_EXIT);
        }
    }

    /**
     * @param {string} action
     * @returns {Promise<void>}
     */
    async manualControl(action) {
        // eslint-disable-next-line eqeqeq
        if (ViomiManualControlDirection[action] == null) {
            throw new Error("Invalid action");
        }
        await this.viomiMove(ViomiManualControlDirection[action]);
    }
}

module.exports = ViomiManualControlCapability;
