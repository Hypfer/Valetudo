const LocateCapability = require("../../../core/capabilities/LocateCapability");
const Logger = require("../../../Logger");

/**
 * @extends LocateCapability<import("../MockValetudoRobot")>
 */
class MockLocateCapability extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        // Ring the terminal bell, just for fun
        process.stdout.write("\x07");
        Logger.info("Locating robot");
    }
}

module.exports = MockLocateCapability;
