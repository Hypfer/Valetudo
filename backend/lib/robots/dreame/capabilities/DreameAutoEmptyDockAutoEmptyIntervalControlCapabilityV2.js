const AutoEmptyDockAutoEmptyIntervalControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyIntervalControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");

/**
 * @extends AutoEmptyDockAutoEmptyIntervalControlCapability<import("../DreameValetudoRobot")>
 */
class DreameAutoEmptyDockAutoEmptyIntervalControlCapabilityV2 extends AutoEmptyDockAutoEmptyIntervalControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.SIID;
        this.piid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.AUTO_EMPTY_ENABLED.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getInterval() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        switch (res) {
            case 3:
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT;
            case 2:
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT;
            case 1:
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
            case 0:
            default:
                return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF;
        }
    }

    async setInterval(newInterval) {
        let val;

        switch (newInterval) {
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF:
                val = 0;
                break;
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL:
                val = 1;
                break;
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT:
                val = 2;
                break;
            case AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT:
                val = 3;
                break;
            default:
                throw new Error(`Received invalid interval ${newInterval}`);
        }

        await this.helper.writeProperty(this.siid, this.piid, val);
    }

    getProperties() {
        return {
            supportedIntervals: [
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.OFF,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.FREQUENT,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT,
            ]
        };
    }
}

module.exports = DreameAutoEmptyDockAutoEmptyIntervalControlCapabilityV2;
