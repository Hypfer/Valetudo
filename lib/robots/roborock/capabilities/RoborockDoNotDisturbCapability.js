const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

class RoborockDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const res = await this.robot.sendCommand("get_dnd_timer", [], {});

        const output = {
            enabled: (res[0].enabled === 1),
            start: {
                hour: res[0].start_hour,
                minute: res[0].start_minute
            },
            end: {
                hour: res[0].end_hour,
                minute: res[0].end_minute
            }
        };

        return new ValetudoDNDConfiguration(output);
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async deleteDndConfiguration() {
        await this.robot.sendCommand("close_dnd_timer", [], {});
    }

    /**
     * @abstract
     * @param {ValetudoDNDConfiguration} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        await this.robot.sendCommand("set_dnd_timer", [
            parseInt(dndConfig.start.hour),
            parseInt(dndConfig.start.minute),
            parseInt(dndConfig.end.hour),
            parseInt(dndConfig.end.minute)
        ], {});
    }
}

module.exports = RoborockDoNotDisturbCapability;