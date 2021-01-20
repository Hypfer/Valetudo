const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

class RoborockDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     *
     * @abstract
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const res = await this.robot.sendCommand("get_dnd_timer", [], {});

        return new ValetudoDNDConfiguration({
            enabled: (res[0].enabled === 1),
            start: {
                hour: res[0].start_hour,
                minute: res[0].start_minute
            },
            end: {
                hour: res[0].end_hour,
                minute: res[0].end_minute
            }
        });
    }

    /**
     * @abstract
     * @param {ValetudoDNDConfiguration} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        if (dndConfig.enabled === true) {
            return this.robot.sendCommand("set_dnd_timer", [
                dndConfig.start.hour,
                dndConfig.start.minute,
                dndConfig.end.hour,
                dndConfig.end.minute
            ], {});
        } else {
            return this.robot.sendCommand("close_dnd_timer", [], {});
        }
    }
}

module.exports = RoborockDoNotDisturbCapability;
