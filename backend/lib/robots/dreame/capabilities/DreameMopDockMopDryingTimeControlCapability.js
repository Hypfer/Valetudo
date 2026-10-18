/**
 * @typedef {import("../../../core/capabilities/MopDockMopDryingTimeControlCapability").MopDockMopDryingTimeDuration} MopDockMopDryingTimeDuration
 */

const DreameMiotServices = require("../DreameMiotServices");
const MopDockMopDryingTimeControlCapability = require("../../../core/capabilities/MopDockMopDryingTimeControlCapability");

/**
 * @extends MopDockMopDryingTimeControlCapability<import("../DreameValetudoRobot")>
 */
class DreameMopDockMopDryingTimeControlCapability extends MopDockMopDryingTimeControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * @param {Array<MopDockMopDryingTimeDuration>} [options.supportedDurations]
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DRYING_TIME.PIID;

        this.supportedDurations = options.supportedDurations ?? [
            DreameMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS,
            DreameMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS,
            DreameMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS,
        ];

        this.quietDryingSupported = this.supportedDurations.includes(DreameMopDockMopDryingTimeControlCapability.DURATION.QUIET);
    }

    async getDuration() {
        if (this.quietDryingSupported) {
            const quietRes = await this.robot.miotHelper.readProperty(
                DreameMiotServices["GEN2"].MOP_EXPANSION.SIID,
                DreameMiotServices["GEN2"].MOP_EXPANSION.PROPERTIES.QUIET_MOP_DRYING.PIID
            );

            if (quietRes === 1) {
                return DreameMopDockMopDryingTimeControlCapability.DURATION.QUIET;
            }
        }

        const res = await this.robot.miotHelper.readProperty(this.siid, this.piid);

        switch (res) {
            case 2:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.TWO_HOURS;
            case 3:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.THREE_HOURS;
            case 4:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.FOUR_HOURS;
            case 5:
                return DreameMopDockMopDryingTimeControlCapability.DURATION.FIVE_HOURS;
            default:
                throw new Error(`Received invalid value ${res}`);
        }
    }

    async setDuration(newDuration) {
        if (this.quietDryingSupported) {
            if (newDuration === DreameMopDockMopDryingTimeControlCapability.DURATION.QUIET) {
                await this.robot.miotHelper.writeProperty(
                    DreameMiotServices["GEN2"].MOP_EXPANSION.SIID,
                    DreameMiotServices["GEN2"].MOP_EXPANSION.PROPERTIES.QUIET_MOP_DRYING.PIID,
                    1
                );
                return;
            }

            await this.robot.miotHelper.writeProperty(
                DreameMiotServices["GEN2"].MOP_EXPANSION.SIID,
                DreameMiotServices["GEN2"].MOP_EXPANSION.PROPERTIES.QUIET_MOP_DRYING.PIID,
                0
            );
        }

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
            case DreameMopDockMopDryingTimeControlCapability.DURATION.FIVE_HOURS:
                val = 5;
                break;
            default:
                throw new Error(`Received invalid value ${newDuration}`);
        }

        await this.robot.miotHelper.writeProperty(this.siid, this.piid, val);
    }

    getProperties() {
        return {
            supportedDurations: this.supportedDurations,
        };
    }
}

module.exports = DreameMopDockMopDryingTimeControlCapability;
