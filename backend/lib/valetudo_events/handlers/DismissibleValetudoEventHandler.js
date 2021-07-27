const ValetudoEventHandler = require("./ValetudoEventHandler");

class DismissibleValetudoEventHandler extends ValetudoEventHandler {
    /**
     * @param {ValetudoEventHandler.INTERACTIONS} interaction
     * @returns {Promise<boolean>}
     */
    async interact(interaction) {
        if (interaction === ValetudoEventHandler.INTERACTIONS.OK) {
            return true;
        } else {
            throw new Error("Invalid Interaction");
        }
    }
}

module.exports = DismissibleValetudoEventHandler;
