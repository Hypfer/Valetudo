const CarpetSensorModeControlCapability = require("../../../core/capabilities/CarpetSensorModeControlCapability");
const Logger = require("../../../Logger");

/**
 * @extends CarpetSensorModeControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockCarpetSensorModeControlCapability extends CarpetSensorModeControlCapability {

    /**
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     * @param {number} options.liftModeId
     */
    constructor(options) {
        super(options);

        this.liftModeId = options.liftModeId;
    }

    async getMode() {
        const res = await this.robot.sendCommand("get_carpet_clean_mode", [], {});

        switch (res?.[0]?.carpet_clean_mode) {
            case 2:
                return CarpetSensorModeControlCapability.MODE.OFF;
            case 1: //Non-camera based?
            case 3: //Camera-based?
                return CarpetSensorModeControlCapability.MODE.LIFT;
            case 0:
                return CarpetSensorModeControlCapability.MODE.AVOID;
            default:
                Logger.warn(`Received invalid value ${res?.[0]?.carpet_clean_mode}`);

                return CarpetSensorModeControlCapability.MODE.OFF;
        }
    }

    async setMode(newMode) {
        let val;

        switch (newMode) {
            case CarpetSensorModeControlCapability.MODE.OFF:
                val = 2;
                break;
            case CarpetSensorModeControlCapability.MODE.LIFT:
                val = this.liftModeId;
                break;
            case CarpetSensorModeControlCapability.MODE.AVOID:
                val = 0;
                break;
            default:
                throw new Error(`Received invalid mode ${newMode}`);
        }

        return this.robot.sendCommand("set_carpet_clean_mode", { "carpet_clean_mode": val }, {});
    }

    getProperties() {
        return {
            supportedModes: [
                CarpetSensorModeControlCapability.MODE.LIFT,
                CarpetSensorModeControlCapability.MODE.AVOID,
                CarpetSensorModeControlCapability.MODE.OFF,
            ]
        };
    }
}

module.exports = RoborockCarpetSensorModeControlCapability;
