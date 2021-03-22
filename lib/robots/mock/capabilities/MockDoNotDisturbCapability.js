const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

class MockDoNotDisturbCapability extends DoNotDisturbCapability {
    constructor(options) {
        super(options);

        this.dndConfig = new ValetudoDNDConfiguration({
            enabled: true,
            start: {
                hour: 22,
                minute: 0
            },
            end: {
                hour: 8,
                minute: 0
            }
        });
    }

    /**
     * @returns {Promise<import("../../../entities/core/ValetudoDNDConfiguration")>}
     */
    async getDndConfiguration() {
        return new ValetudoDNDConfiguration(this.dndConfig);
    }

    /**
     * @param {import("../../../entities/core/ValetudoDNDConfiguration")} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        this.dndConfig = dndConfig;
    }
}

module.exports = MockDoNotDisturbCapability;
