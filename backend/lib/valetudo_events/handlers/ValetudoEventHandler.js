const NotImplementedError = require("../../core/NotImplementedError");

class ValetudoEventHandler {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../events/ValetudoEvent")} options.event
     */
    constructor(options) {
        this.robot = options.robot;
        this.event = options.event;
    }

    /**
     * @abstract
     * @param {ValetudoEventInteraction} interaction
     * @returns {Promise<boolean>} True if the Event should be set to processed
     */
    async interact(interaction) {
        throw new NotImplementedError();
    }
}

/**
 *
 *  Inspired by Winforms
 *  https://docs.microsoft.com/en-us/dotnet/api/system.windows.forms.dialogresult
 *
 *  @typedef {string} ValetudoEventInteraction
 *  @enum {string}
 *
 */
ValetudoEventHandler.INTERACTIONS = Object.freeze({
    OK: "ok",
    YES: "yes",
    NO: "no",
    RESET: "reset"
});

module.exports = ValetudoEventHandler;
