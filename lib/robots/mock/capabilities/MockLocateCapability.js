const LocateCapability = require("../../../core/capabilities/LocateCapability");

class MockLocateCapability extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        // Ring the terminal bell, just for fun
        process.stdout.write("\x07");
    }
}

module.exports = MockLocateCapability;
