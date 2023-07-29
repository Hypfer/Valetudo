const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const Logger = require("../../../Logger");


const attributes = require("../ViomiCommonAttributes");
const stateAttrs = require("../../../entities/state/attributes");

/**
 * This capability provides methods to start, stop, pause and resume the current cleaning operation.
 * The vacuum expects the control software to remember the parameters of the last cleaning command, and re-submit them
 * when pausing or resuming.
 *
 * For this reason, no other capability should run the following commands on their own:
 * - set_mode - use setRectangularZoneMode() or stop() instead
 * - set_mode_withroom - use setModeWithSegments() instead
 *
 * They should instead prepare their data, retrieve this capability and use it to perform the operation.
 * This capability will take care of remembering the parameters for subsequent pause/resume commands.
 *
 * @extends BasicControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiBasicControlCapability extends BasicControlCapability {
    /**
     *
     * @private
     * @param {boolean} [outline] Vacuum along the edges
     */
    getVacuumMovementMode(outline) {
        const OperationModeAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
            attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.OPERATION_MODE
        });

        switch (OperationModeAttribute?.value) {
            case stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM_AND_MOP:
                return attributes.ViomiMovementMode.VACUUM_AND_MOP;
            case stateAttrs.PresetSelectionStateAttribute.MODE.MOP:
                return attributes.ViomiMovementMode.MOP;
            case stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM:
                if (outline) {
                    return attributes.ViomiMovementMode.OUTLINE;
                } else {
                    return attributes.ViomiMovementMode.VACUUM;
                }
            default:
                return attributes.ViomiMovementMode.VACUUM;
        }
    }

    /**
     * Start or resume cleaning the specified segment IDs, or the entire house.
     *
     * @public
     * @param {any} operation Whether to start, stop or pause
     * @param {Array<number>} [segmentIds] If specified, room IDs to clean. Else all house.
     * @returns {Promise<void>}
     */
    async setModeWithSegments(operation, segmentIds) {
        const movementMode = this.getVacuumMovementMode(this.robot.ephemeralState.outlineModeEnabled);

        if (segmentIds === undefined || segmentIds === null) {
            segmentIds = [];
        }
        await this.robot.sendCommand(
            "set_mode_withroom",
            [movementMode, operation, segmentIds.length].concat(segmentIds)
        );

        if (operation !== attributes.ViomiOperation.STOP) {
            if (segmentIds.length > 0) {
                this.robot.ephemeralState.lastOperationType = stateAttrs.StatusStateAttribute.FLAG.SEGMENT;
            } else {
                this.robot.ephemeralState.lastOperationType = stateAttrs.StatusStateAttribute.FLAG.NONE;
            }
            this.robot.ephemeralState.lastOperationAdditionalParams = segmentIds;
        }
    }

    /**
     * Start, pause or resume vacuum after sending "set_zone". This can be used by ZoneCleaningCapability to start
     * cleaning after sending the rectangular area, then later for pausing and resuming.
     *
     * @public
     * @param {any} operation
     * @returns {Promise<void>}
     */
    async setRectangularZoneMode(operation) {
        if (operation === attributes.ViomiOperation.PAUSE) {
            Logger.warn("ViomiBasicControlCapability.setRectangularZoneMode should be used with PAUSE_RECTANGULAR_ZONE instead of pause!");
            operation = attributes.ViomiOperation.PAUSE_RECTANGULAR_ZONE;
        }
        await this.robot.sendCommand("set_mode", [attributes.ViomiZoneCleaningCommand.CLEAN_ZONE, operation]);

        if (operation !== attributes.ViomiOperation.STOP) {
            this.robot.ephemeralState.lastOperationType = stateAttrs.StatusStateAttribute.FLAG.ZONE;
            this.robot.ephemeralState.lastOperationAdditionalParams = [];
        }
    }

    /**
     * Start full house cleaning or resume previously paused operation.
     *
     * @returns {Promise<void>}
     */
    async start() {
        const lastOperation = this.robot.ephemeralState.lastOperationType;
        const lastOperationAdditionalParams = this.robot.ephemeralState.lastOperationAdditionalParams;

        switch (lastOperation) {
            // Resume
            case stateAttrs.StatusStateAttribute.FLAG.NONE:
            case stateAttrs.StatusStateAttribute.FLAG.SEGMENT:
                await this.setModeWithSegments(attributes.ViomiOperation.START, lastOperationAdditionalParams);
                break;
            case stateAttrs.StatusStateAttribute.FLAG.ZONE:
                await this.setRectangularZoneMode(attributes.ViomiOperation.START);
                break;
            default:
                await this.setModeWithSegments(attributes.ViomiOperation.START);
                break;
        }
    }

    /**
     * Stop previously started operation, in a way that is not resumable.
     *
     * @returns {Promise<void>}
     */
    async stop() {
        const statusAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.StatusStateAttribute
        );

        if (statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.RETURNING) {
            // With the "stop returning" command as opposed to the common "stop" the voice provides the correct feedback
            await this.robot.sendCommand("set_charge", [0]);
        } else if (statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.CLEANING) {
            await this.setRectangularZoneMode(attributes.ViomiOperation.STOP);
        } else {
            await this.robot.sendCommand("set_mode", [attributes.ViomiOperation.STOP]);
        }

        this.robot.ephemeralState.lastOperationType = null;
        this.robot.ephemeralState.lastOperationAdditionalParams = [];
    }

    /**
     * Pause the current operation in a way that can be later resumed by running start().
     *
     * @returns {Promise<void>}
     */
    async pause() {
        const statusAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.StatusStateAttribute
        );

        let lastOperation = this.robot.ephemeralState.lastOperationType;
        let lastOperationAdditionalParams = this.robot.ephemeralState.lastOperationAdditionalParams;

        // We can't pause/resume cleaning if the requested position isn't saved
        if ((lastOperation === stateAttrs.StatusStateAttribute.FLAG.SEGMENT || lastOperation === stateAttrs.StatusStateAttribute.FLAG.SPOT) &&
            lastOperationAdditionalParams.length === 0) {

            lastOperation = null;
        }

        // Pausing requires us to remember how we started cleaning. If we don't know it resuming won't work,
        // therefore we just stop. Also, pausing "return to dock" is the same as stopping it
        if (lastOperation === null || statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.RETURNING) {
            await this.stop();
            return;
        }

        if (lastOperation === stateAttrs.StatusStateAttribute.FLAG.ZONE) {
            await this.setRectangularZoneMode(attributes.ViomiOperation.PAUSE_RECTANGULAR_ZONE);
        } else {
            await this.setModeWithSegments(attributes.ViomiOperation.PAUSE, lastOperationAdditionalParams);
        }
    }

    async home() {
        // If the vacuum is docked and we try to dock it again, it will start making out with the dock until stopped.
        const statusAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.StatusStateAttribute
        );

        if (statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED) {
            return;
        }

        await this.robot.sendCommand("set_charge", [1]);
        this.robot.ephemeralState.lastOperationType = null;
        this.robot.ephemeralState.lastOperationAdditionalParams = [];
    }
}


module.exports = ViomiBasicControlCapability;
