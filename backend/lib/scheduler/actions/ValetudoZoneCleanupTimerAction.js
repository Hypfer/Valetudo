const ValetudoTimerAction = require("./ValetudoTimerAction");
const ZoneCleaningCapability = require("../../core/capabilities/ZoneCleaningCapability");

class ValetudoZoneCleanupTimerAction extends ValetudoTimerAction {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.zoneId
     */
    constructor(options) {
        super(options);

        this.zoneId = options.zoneId;
    }

    async run() {
        if (!this.zoneId) {
            throw new Error("Missing zoneId");
        }

        if (!this.robot.hasCapability(ZoneCleaningCapability.TYPE)) {
            throw new Error("Robot is missing the ZoneCleaningCapability");
        } else {
            const capability = this.robot.capabilities[ZoneCleaningCapability.TYPE];
            const zonePreset = this.robot.config.get("zonePresets")[this.zoneId];

            if (zonePreset) {
                return capability.start(zonePreset.zones);
            } else {
                throw new Error("There is no zone preset with id " + this.zoneId);
            }
        }
    }
}

module.exports = ValetudoZoneCleanupTimerAction;
