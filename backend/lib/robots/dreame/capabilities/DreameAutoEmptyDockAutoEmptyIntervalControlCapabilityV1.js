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
        this.piid_interval = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.INTERVAL.PIID;
        this.piid_enabled = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.AUTO_EMPTY_ENABLED.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getInterval() {
        const res_enabled = await this.helper.readProperty(this.siid, this.piid_enabled);
        
        if (!res_enabled) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
        }

        const res_interval = await this.helper.readProperty(this.siid, this.piid_interval);

        if (res_interval > 1) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT;
        } else if (res_interval > 0) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
        } else {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
        }
    }

    async setInterval(newInterval) {
        if (newInterval === AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF) {
            await this.helper.writeProperty(this.siid, this.piid_enabled, 0);
        } else {
            let val;

            switch (newInterval) {
                case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL:
                    val = 1;
                    break;
                case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT:
                    val = 3;
                    break;
                default:
                    throw new Error(`Received invalid interval ${newInterval}`);
            }

            await Promise.all([
                this.helper.writeProperty(this.siid, this.piid_enabled, 1),
                this.helper.writeProperty(this.siid, this.piid_interval, val),
            ]);
        }
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
