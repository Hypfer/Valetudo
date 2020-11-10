const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");

const attributes = require("../ViomiCommonAttributes");

class ViomiBasicControlCapability extends BasicControlCapability {

    /**
     * @private
     *
     * @param {{operation: number}} options
     * @param {attributes.ViomiMovementMode} [options.movementMode] //If unset, we'll use the current value
     * @param {attributes.ViomiOperation} options.operation //Stop/Start/Pause
     * @param {Array} [options.additionalParameters]
     *
     * @returns {Promise<object>}
     */
    async startOperation(options) {
        let command = "set_mode";
        let operation = [undefined, options.operation];

        if (options.movementMode === undefined) {
            //operation[0] = this.getCurrentMovementMode();
            throw Error("Not implemented");
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
            additionalParameters: []
            //Intentional empty array to force set_mode_withroom command since the viomi api is utterly broken
        });
    }

    async stop() {
        await this.startOperation({operation: attributes.ViomiOperation.STOP});
    }

    async pause() {
        await this.startOperation({operation: attributes.ViomiOperation.PAUSE});
    }

    async home() {
        await this.robot.sendCommand("set_charge", [1]);
    }
}


module.exports = ViomiBasicControlCapability;