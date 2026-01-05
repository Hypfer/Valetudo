const AutoEmptyDockAutoEmptyDurationControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyDurationControlCapability");

/**
 * @extends AutoEmptyDockAutoEmptyDurationControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockAutoEmptyDockAutoEmptyDurationControlCapability extends AutoEmptyDockAutoEmptyDurationControlCapability {
    async getDuration() {
        const res = await this.robot.sendCommand("get_dust_collection_mode", [], {});

        switch (res?.mode) {
            case 4:
                return RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.LONG;
            case 2:
                return RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.MEDIUM;
            case 1:
                return RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.SHORT;
            case 0:
                return RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.AUTO;
            default:
                throw new Error(`Received invalid value ${res?.mode}`);
        }
    }

    async setDuration(newDuration) {
        let val;

        switch (newDuration) {
            case RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.LONG:
                val = 4;
                break;
            case RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.MEDIUM:
                val = 2;
                break;
            case RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.SHORT:
                val = 1;
                break;
            case RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.AUTO:
                val = 0;
                break;
            default:
                throw new Error(`Invalid value ${newDuration}`);
        }

        return this.robot.sendCommand("set_dust_collection_mode", { "mode": val }, {});
    }

    getProperties() {
        return {
            supportedDurations: [
                RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.AUTO,
                RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.SHORT,
                RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.MEDIUM,
                RoborockAutoEmptyDockAutoEmptyDurationControlCapability.DURATION.LONG,
            ],
        };
    }
}

module.exports = RoborockAutoEmptyDockAutoEmptyDurationControlCapability;
