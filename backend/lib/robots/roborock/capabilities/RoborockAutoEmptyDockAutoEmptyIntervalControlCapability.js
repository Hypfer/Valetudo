const AutoEmptyDockAutoEmptyIntervalControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyIntervalControlCapability");

/**
 * @extends AutoEmptyDockAutoEmptyIntervalControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockAutoEmptyDockAutoEmptyIntervalControlCapability extends AutoEmptyDockAutoEmptyIntervalControlCapability {
    async getInterval() {
        const res = await this.robot.sendCommand("get_dust_collection_switch_status", [], {});

        if (res.status === 1) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
        } else {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
        }
    }

    async setInterval(newInterval) {
        const val = newInterval === AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL ? 1 : 0;

        await this.robot.sendCommand("set_dust_collection_switch_status", { "status": val }, {});
    }

    getProperties() {
        return {
            supportedIntervals: [
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL,
            ]
        };
    }
}

module.exports = RoborockAutoEmptyDockAutoEmptyIntervalControlCapability;
