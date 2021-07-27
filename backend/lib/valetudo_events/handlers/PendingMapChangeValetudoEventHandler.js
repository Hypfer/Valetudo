const PendingMapChangeHandlingCapability = require("../../core/capabilities/PendingMapChangeHandlingCapability");
const ValetudoEventHandler = require("./ValetudoEventHandler");

class PendingMapChangeValetudoEventHandler extends ValetudoEventHandler {
    /**
     * @param {ValetudoEventHandler.INTERACTIONS} interaction
     * @returns {Promise<boolean>}
     */
    async interact(interaction) {
        if (interaction === ValetudoEventHandler.INTERACTIONS.YES) {
            return this.interactHelper(true);
        } else if (interaction === ValetudoEventHandler.INTERACTIONS.NO) {
            return this.interactHelper(false);
        } else {
            throw new Error("Invalid Interaction");
        }
    }

    /**
     * @private
     * @param {boolean} accept
     */
    async interactHelper(accept) {
        if (this.robot.hasCapability(PendingMapChangeHandlingCapability.TYPE)) {
            if (accept === true) {
                await this.robot.capabilities[PendingMapChangeHandlingCapability.TYPE].acceptChange();
            } else {
                await this.robot.capabilities[PendingMapChangeHandlingCapability.TYPE].rejectChange();
            }

            return true;
        } else {
            throw new Error("Robot is missing the required PendingMapChangeHandlingCapability");
        }
    }
}

module.exports = PendingMapChangeValetudoEventHandler;
