const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const MopDockMopDryingTimeControlCapability = require("../../../core/capabilities/MopDockMopDryingTimeControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MopDockMopDryingTimeControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockMopDryingTimeControlCapability extends MopDockMopDryingTimeControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DRYING_TIME.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getDuration() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        switch (res) {
            case 2:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS;
            case 3:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS;
            case 4:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS;
            default:
                throw new Error(`Received invalid value ${res}`);
        }
    }

    async setDuration(newDuration) {
        let val;

        switch (newDuration) {
            case DreameMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS:
                val = 2;
                break;
            case DreameMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS:
                val = 3;
                break;
            case DreameMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS:
                val = 4;
                break;
            default:
                throw new Error(`Received invalid value ${newDuration}`);
        }

        await this.helper.writeProperty(
            DreameMiotServices["GEN2"].VACUUM_2.SIID,
            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DRYING_TIME.PIID,
            val
        );

        await sleep(100); // Give the firmware some time to think
    }

    getProperties() {
        return {
            supportedDurations: [
                DreameMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS,
                DreameMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS,
                DreameMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS,
            ],
        };
    }
}

module.exports = DreameMopDockMopDryingTimeControlCapability;
