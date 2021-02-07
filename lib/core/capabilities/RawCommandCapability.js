const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/*
    Development API to send raw commands to the vacuum.
    It must be explicitly enabled by setting debug.enableRawCommandsCapability = true in config.
 */
class RawCommandCapability extends Capability {
    /**
     * @param {object} payload Raw command payload
     * @abstract Send raw command to vacuum. Payload might be device-specific
     * @returns {Promise<object>}
     */
    async rawCommand(payload) {
        throw new NotImplementedError();
    }

    getType() {
        return RawCommandCapability.TYPE;
    }
}

RawCommandCapability.TYPE = "RawCommandCapability";

module.exports = RawCommandCapability;
