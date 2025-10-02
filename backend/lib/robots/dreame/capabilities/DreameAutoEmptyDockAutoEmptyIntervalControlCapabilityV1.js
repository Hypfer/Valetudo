const AutoEmptyDockAutoEmptyIntervalControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyIntervalControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");

/**
 * @extends AutoEmptyDockAutoEmptyIntervalControlCapability<import("../DreameValetudoRobot")>
 */
class DreameAutoEmptyDockAutoEmptyIntervalControlCapabilityV1 extends AutoEmptyDockAutoEmptyIntervalControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.SIID;
        this.auto_empty_piid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.AUTO_EMPTY_ENABLED.PIID;
        this.interval_piid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.INTERVAL.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getInterval() {
        const res = await this.helper.readProperty(this.siid, this.auto_empty_piid);
        const intervalRes = await this.helper.readProperty(this.siid, this.interval_piid);

        if (res === 0) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
        }
        if (intervalRes === 1) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
        }

        return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT;
    }

    async setInterval(newInterval) {
        let autoEmptyValue;
        let intervalValue;

        switch (newInterval) {
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF:
                autoEmptyValue = 0;
                intervalValue = 1;
                break;
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL:
                autoEmptyValue = 1;
                intervalValue = 1;
                break;
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT:
                autoEmptyValue = 1;
                intervalValue = 3;
                break;
            default:
                throw new Error(`Received invalid interval ${newInterval}`);
        }

        await this.helper.writeProperty(this.siid, this.auto_empty_piid, autoEmptyValue);
        await this.helper.writeProperty(this.siid, this.interval_piid, intervalValue);
    }

    getProperties() {
        return {
            supportedIntervals: [
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT,
            ]
        };
    }
}

module.exports = DreameAutoEmptyDockAutoEmptyIntervalControlCapabilityV1;
