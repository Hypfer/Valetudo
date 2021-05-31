const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

/**
 * @extends DoNotDisturbCapability<import("../RoborockValetudoRobot")>
 */
class RoborockDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     *
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const res = await this.robot.sendCommand("get_dnd_timer", [], {});
        const offset = new Date().getTimezoneOffset();

        return new ValetudoDNDConfiguration({
            enabled: (res[0].enabled === 1),
            start: RoborockDoNotDisturbCapability.convertTime(
                res[0].start_hour,
                res[0].start_minute,
                offset
            ),
            end: RoborockDoNotDisturbCapability.convertTime(
                res[0].end_hour,
                res[0].end_minute,
                offset
            ),
        });
    }

    /**
     * @abstract
     * @param {ValetudoDNDConfiguration} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        if (dndConfig.enabled === true) {
            const offset = new Date().getTimezoneOffset() *-1;
            const start = RoborockDoNotDisturbCapability.convertTime(
                dndConfig.start.hour,
                dndConfig.start.minute,
                offset
            );
            const end = RoborockDoNotDisturbCapability.convertTime(
                dndConfig.end.hour,
                dndConfig.end.minute,
                offset
            );

            return this.robot.sendCommand("set_dnd_timer", [
                start.hour,
                start.minute,
                end.hour,
                end.minute
            ], {});
        } else {
            return this.robot.sendCommand("close_dnd_timer", [], {});
        }
    }

    /**
     * Valetudo aims to use UTC only and leave timezone conversion stuff to the frontend.
     * This will work fine for most things, however unfortunately Roborock DND is an edge case
     * 
     * Due to the daily reboot happening at 3-4am, the robot cannot use UTC as its system time
     * since that would interfere with regular operation for users that don't live near UTC
     * 
     * Therefore, the timezone needs to be set correctly (out of scope for valetudo!) and
     * we need to store DND as localTime
     * 
     * @private
     * @param {number} hour
     * @param {number} minute
     * @param {number} offset
     */
    static convertTime(hour, minute, offset) {
        const dayInMinutes = 24*60;

        const inMidnightOffset = hour * 60 + minute;
        let outMidnightOffset = inMidnightOffset + offset;

        if (outMidnightOffset < 0) {
            outMidnightOffset += dayInMinutes;
        } else if (outMidnightOffset > dayInMinutes) {
            outMidnightOffset -= dayInMinutes;
        }

        return {
            hour: outMidnightOffset/60 |0,
            minute: outMidnightOffset%60
        };
    }
}

module.exports = RoborockDoNotDisturbCapability;
