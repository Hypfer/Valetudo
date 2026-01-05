const MopDockMopDryingTimeControlCapability = require("../../../core/capabilities/MopDockMopDryingTimeControlCapability");

/**
 * @extends MopDockMopDryingTimeControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMopDockMopDryingTimeControlCapability extends MopDockMopDryingTimeControlCapability {
    async getDuration() {
        const res = await this.robot.sendCommand("app_get_dryer_setting", [], {});

        const duration = res?.on.dry_time ?? 0;

        if (duration <= 2 * 60 * 60) {
            return RoborockMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS;
        } else if (duration <= 3 * 60 * 60) {
            return RoborockMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS;
        } else {
            return RoborockMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS;
        }
    }

    async setDuration(newDuration) {
        let val;

        switch (newDuration) {
            case RoborockMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS:
                val = 2 * 60 * 60;
                break;
            case RoborockMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS:
                val = 3 * 60 * 60;
                break;
            case RoborockMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS:
                val = 4 * 60 * 60;
                break;
            default:
                throw new Error("Invalid duration");
        }

        return this.robot.sendCommand("app_set_dryer_setting", {"on": { "dry_time": val } }, {});
    }

    getProperties() {
        return {
            supportedDurations: [
                RoborockMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS,
                RoborockMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS,
                RoborockMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS,
            ],
        };
    }
}

module.exports = RoborockMopDockMopDryingTimeControlCapability;
