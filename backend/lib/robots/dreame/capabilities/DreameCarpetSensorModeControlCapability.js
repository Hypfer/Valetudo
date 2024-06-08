const CarpetSensorModeControlCapability = require("../../../core/capabilities/CarpetSensorModeControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const Logger = require("../../../Logger");

/**
 * @extends CarpetSensorModeControlCapability<import("../DreameValetudoRobot")>
 */
class DreameCarpetSensorModeControlCapability extends CarpetSensorModeControlCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * @param {boolean} [options.liftSupported]
     * @param {boolean} [options.detachSupported]
     */
    constructor(options) {
        super(options);

        this.liftSupported = options.liftSupported ?? false;
        this.detachSupported = options.detachSupported ?? false;

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.sensor_piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.CARPET_DETECTION_SENSOR.PIID;
        this.mode_piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.CARPET_DETECTION_SENSOR_MODE.PIID;
        this.mop_detach_piid =DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MOP_DETACH.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getMode() {
        const sensorRes = await this.helper.readProperty(this.siid, this.sensor_piid);

        if (sensorRes === 0) {
            return CarpetSensorModeControlCapability.MODE.OFF;
        } else if (sensorRes === 1) {
            if (this.liftSupported || this.detachSupported) {
                const modeRes = await this.helper.readProperty(this.siid, this.mode_piid);

                switch (modeRes) {
                    case 3:
                        return CarpetSensorModeControlCapability.MODE.DETACH;
                    case 2:
                        return CarpetSensorModeControlCapability.MODE.LIFT;
                    case 1:
                        return CarpetSensorModeControlCapability.MODE.AVOID;
                    default:
                        Logger.warn(`Received invalid mode ${modeRes}`);

                        return CarpetSensorModeControlCapability.MODE.OFF;
                }
            } else {
                return CarpetSensorModeControlCapability.MODE.AVOID;
            }
        } else {
            Logger.warn(`The carpet sensor reports error code ${sensorRes}. Toggle the carpet sensor mode to reset.`);

            return CarpetSensorModeControlCapability.MODE.OFF;
        }
    }

    async setMode(newMode) {
        let sensorVal;
        let modeVal;
        let mopDetachVal;

        switch (newMode) {
            case CarpetSensorModeControlCapability.MODE.DETACH:
                if (!this.detachSupported) {
                    throw new Error(`Received unsupported mode ${newMode}`);
                }

                sensorVal = 1;
                modeVal = 3;
                mopDetachVal = 1;
                break;
            case CarpetSensorModeControlCapability.MODE.LIFT:
                if (!this.liftSupported) {
                    throw new Error(`Received unsupported mode ${newMode}`);
                }

                sensorVal = 1;
                modeVal = 2;
                mopDetachVal = undefined;
                break;
            case CarpetSensorModeControlCapability.MODE.AVOID:
                sensorVal = 1;
                modeVal = 1;
                mopDetachVal = undefined;

                break;
            case CarpetSensorModeControlCapability.MODE.OFF:
                sensorVal = 0;
                modeVal = undefined;
                mopDetachVal = undefined;

                break;
            default:
                throw new Error(`Received invalid mode ${newMode}`);
        }

        await this.helper.writeProperty(this.siid, this.sensor_piid, sensorVal);
        if (this.liftSupported && modeVal !== undefined) {
            await this.helper.writeProperty(this.siid, this.mode_piid, modeVal);
        }
        if (this.detachSupported && mopDetachVal !== undefined) {
            await this.helper.writeProperty(this.siid, this.mop_detach_piid, mopDetachVal);
        }
    }

    getProperties() {
        const supportedModes = [
            CarpetSensorModeControlCapability.MODE.AVOID,
            CarpetSensorModeControlCapability.MODE.OFF,
        ];

        if (this.liftSupported) {
            supportedModes.push(
                CarpetSensorModeControlCapability.MODE.LIFT
            );
        }

        if (this.detachSupported) {
            supportedModes.push(
                CarpetSensorModeControlCapability.MODE.DETACH
            );
        }

        return {
            supportedModes: supportedModes
        };
    }
}

module.exports = DreameCarpetSensorModeControlCapability;
