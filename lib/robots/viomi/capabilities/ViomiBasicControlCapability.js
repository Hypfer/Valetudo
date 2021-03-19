const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");

const attributes = require("../ViomiCommonAttributes");
const stateAttrs = require("../../../entities/state/attributes");

class ViomiBasicControlCapability extends BasicControlCapability {

    /**
     * Automatically sets mop mode depending on what tools are currently installed
     *
     * @returns {attributes.ViomiOperationMode}
     */
    getAutoVacuumOperationMode() {
        const dustbinAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
        });
        const waterboxAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK
        });
        const mopAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
        });

        if (mopAttribute?.attached) {
            if (waterboxAttribute?.attached && dustbinAttribute?.attached) {
                return attributes.ViomiOperationMode.MIXED;
            }
            return attributes.ViomiOperationMode.MOP;
        }
        return attributes.ViomiOperationMode.VACUUM;
    }

    /**
     * Automatically set movement mode based on the previously computed operation mode
     *
     * @param {attributes.ViomiOperationMode} operationMode
     * @param {boolean} [outline] Vacuum along the edges
     * @returns {attributes.ViomiMovementMode}
     */
    getAutoVacuumMovementMode(operationMode, outline) {
        if (outline) {
            return attributes.ViomiMovementMode.OUTLINE;
        }

        switch (operationMode) {
            case attributes.ViomiOperationMode.MIXED:
                return attributes.ViomiMovementMode.MOP_MOVES;
            case attributes.ViomiOperationMode.MOP:
                // doesn't support mop_moves with water-only tank
                return attributes.ViomiMovementMode.ZONED_CLEAN_OR_MOPPING;
            case attributes.ViomiOperationMode.VACUUM:
                return attributes.ViomiMovementMode.NORMAL_CLEANING;
        }
    }

    async start() {
        const operationMode = this.getAutoVacuumOperationMode();
        const curOperationMode = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.OperationModeStateAttribute
        );
        if (!curOperationMode || curOperationMode && curOperationMode.VALUE !== operationMode) {
            await this.robot.sendCommand("set_mop", [operationMode]);
        }

        // TODO: find a way to provide this option
        const outline = false;
        const movementMode = this.getAutoVacuumMovementMode(operationMode, outline);
        const additionalParamsLength = 0;

        await this.robot.sendCommand("set_mode_withroom",
            [movementMode, attributes.ViomiOperation.START, additionalParamsLength]);
    }

    async stop() {
        await this.robot.sendCommand("set_mode", [attributes.ViomiOperation.STOP]);
    }

    // TODO: test
    async pause() {
        const operationMode = this.getAutoVacuumOperationMode();
        const outline = false;
        const movementMode = this.getAutoVacuumMovementMode(operationMode, outline);
        const additionalParamsLength = 0;

        await this.robot.sendCommand("set_mode_withroom",
            [movementMode, attributes.ViomiOperation.PAUSE, additionalParamsLength]);
    }

    async home() {
        // If the vacuum is docked and we try to dock it again, it will start making out with the dock until stopped.
        const statusAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.StatusStateAttribute.name
        });

        if (statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED) {
            return;
        }

        await this.robot.sendCommand("set_charge", [1]);
    }
}


module.exports = ViomiBasicControlCapability;
