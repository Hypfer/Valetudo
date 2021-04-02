const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");
const {DeviceQuietHours, DeviceTime} = require("@agnoc/core");

/**
 * @extends DoNotDisturbCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecDoNotDisturbCapability extends DoNotDisturbCapability {

    /**
     * @returns {Promise<import("../../../entities/core/ValetudoDNDConfiguration")>}
     */
    async getDndConfiguration() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const quietHours = await this.robot.robot.getQuietHours();

        return new ValetudoDNDConfiguration({
            enabled: quietHours.isEnabled,
            start: {
                hour: quietHours.begin.hour,
                minute: quietHours.begin.minute
            },
            end: {
                hour: quietHours.end.hour,
                minute: quietHours.end.minute
            }
        });
    }

    /**
     * @param {import("../../../entities/core/ValetudoDNDConfiguration")} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.setQuietHours(new DeviceQuietHours({
            isEnabled: dndConfig.enabled,
            begin: new DeviceTime({
                hour: dndConfig.start.hour,
                minute: dndConfig.start.minute,
            }),
            end: new DeviceTime({
                hour: dndConfig.end.hour,
                minute: dndConfig.end.minute,
            }),
        }));
    }
};
