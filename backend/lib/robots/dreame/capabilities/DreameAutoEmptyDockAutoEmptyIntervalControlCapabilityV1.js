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
        this.piid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.PROPERTIES.INTERVAL.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getInterval() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        if (res === 1) {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL;
        } else {
            return AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT;
        }
    }

    async setInterval(newInterval) {
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

        await this.helper.writeProperty(this.siid, this.piid, val);
    }

    getProperties() {
        return {
            supportedIntervals: [
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.NORMAL,
                AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL.INFREQUENT,
            ]
        };
    }
}

module.exports = DreameAutoEmptyDockAutoEmptyIntervalControlCapabilityV1;
