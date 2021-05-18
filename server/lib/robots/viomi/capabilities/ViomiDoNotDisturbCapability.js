const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

/**
 * @extends DoNotDisturbCapability<import("../ViomiValetudoRobot")>
 */
class ViomiDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     *
     * @abstract
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const res = await this.robot.sendCommand("get_notdisturb", []);

        return new ValetudoDNDConfiguration({
            enabled: (res[0] === 1),
            start: {
                hour: res[1],
                minute: res[2]
            },
            end: {
                hour: res[3],
                minute: res[4]
            }
        });
    }

    /**
     * @abstract
     * @param {ValetudoDNDConfiguration} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        return this.robot.sendCommand("set_notdisturb", [
            dndConfig.enabled ? 1 : 0,
            dndConfig.start.hour,
            dndConfig.start.minute,
            dndConfig.end.hour,
            dndConfig.end.minute
        ]);
    }
}

module.exports = ViomiDoNotDisturbCapability;
