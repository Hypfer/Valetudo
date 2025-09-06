const AutoEmptyDockAutoEmptyIntervalControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyIntervalControlCapability");

/**
 * @extends AutoEmptyDockAutoEmptyIntervalControlCapability<import("../MockValetudoRobot")>
 */
class MockAutoEmptyDockAutoEmptyIntervalControlCapability extends AutoEmptyDockAutoEmptyIntervalControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.currentInterval = AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
    }

    async getInterval() {
        return this.currentInterval;
    }

    async setInterval(newInterval) {
        this.currentInterval = newInterval;
    }

    getProperties() {
        return {
            supportedIntervals: Object.values(AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL)
        };
    }
}

module.exports = MockAutoEmptyDockAutoEmptyIntervalControlCapability;
