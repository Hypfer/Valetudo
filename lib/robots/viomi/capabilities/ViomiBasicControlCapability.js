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
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
        });
        const mopAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
        });

        if (mopAttribute) {
            if (waterboxAttribute && dustbinAttribute) {
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

    /**
     * @private
     *
     * @param {object} options
     * @param {number} options.operation //Stop/Start/Pause
     * @param {boolean} [options.outline] Vacuum along the edges
     * @param {attributes.ViomiMovementMode} [options.movementMode] //If unset, we'll use the current value
     * @param {[]} [options.additionalParameters]
     *
     * @returns {Promise<object>}
     */
    async startOperation(options) {
        let command = "set_mode";
        let operation = [undefined, options.operation];

        const operationMode = this.getAutoVacuumOperationMode();
        const curOperationMode = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.OperationModeStateAttribute
        );
        if (!curOperationMode || curOperationMode && curOperationMode.VALUE !== operationMode) {
            await this.robot.sendCommand("set_mop", [operationMode]);
        }

        const outline = options.outline !== undefined ? options.outline : false;
        if (options.movementMode === undefined) {
            operation[0] = this.getAutoVacuumMovementMode(operationMode, outline);
        } else {
            operation[0] = options.movementMode;
        }

        if (Array.isArray(options.additionalParameters)) {
            command = "set_mode_withroom";
            operation.push(options.additionalParameters.length);
            operation = operation.concat(options.additionalParameters);
        }

        await this.robot.sendCommand(command, operation);
    }

    async start() {
        await this.startOperation({
            operation: attributes.ViomiOperation.START,
            additionalParameters: [],
            //Intentional empty array to force set_mode_withroom command since the viomi api is utterly broken
        });
    }

    // TODO: stop and pause both effectively pause the operation, though the call times out.
    // This needs to be investigated
    async stop() {
        await this.startOperation({operation: attributes.ViomiOperation.STOP});
    }

    async pause() {
        await this.startOperation({operation: attributes.ViomiOperation.PAUSE});
    }

    async home() {
        // If the vacuum is docked and we try to dock it again, it will start making out with the dock until stopped.
        const statusAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.StatusStateAttribute.name
        });
        if (statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED) {
            return;
        }

        await this.robot.sendCommand("set_charge", [1]);
    }
}


module.exports = ViomiBasicControlCapability;