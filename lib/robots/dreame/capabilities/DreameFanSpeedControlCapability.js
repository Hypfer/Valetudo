const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");

//Todo: do not copy-paste this
const SERVICES = Object.freeze({
    BATTERY: {
        ID: 2,
        PROPERTIES: {
            PERCENTAGE: 1,
            CHARGING_STATUS: 2
            /**
             * CHARGING_STATUS = {
                    Charging: 1,
                    Idle: 2,
                    Error: 3,
                    Charged: 4
                  }
             */
        },
        ACTIONS: {
            START_CHARGE: 1 //also known as home
        }
    },
    PLAY_SOUND: {
        ID: 17,
        ACTIONS: {
            LOCATE: 1,
            TEST_VOLUME: 3
        }
    },
    CORE_VACUUM: {
        ID: 18,
        PROPERTIES: {
            WORK_MODE: 1, //TODO: what is this?
            CLEAN_TIME: 2,
            CLEAN_AREA: 3,
            TIMERS: 5,
            FAN_SPEED: 6, //called SELECT_MODE
            WATER_BOX_STATUS: 9, //TODO: POSSIBLE VALUES
            LAST_CLEAN_TIME: 13,
            LAST_CLEAN_TIMES: 14,
            LAST_CLEAN_AREA: 15,
            LAST_LOG_TIME: 16, //TODO: ???? startUseTime
            LED_MODE: 17,
            TASK_STATUS: 18,
            MOP_MODE: 20,
            SAVE_MAP_STATUS: 23
        },
        ACTIONS: {
            START_CLEANING: 1,
            PAUSE: 2,
            STOP_CLEANING: 3
        }
    },
    TIMEZONE: {
        ID: 25,
        PROPERTIES: {
            TIMEZONE: 1
        }
    },
    ERRORS: {
        ID: 22,
        PROPERTIES: {
            WARNCODES: 1
        }
    },
    CONSUMABLES: {
        ID: 19,
        PROPERTIES: {
            HEAP: 1,
            SLID_BRUSH: 2,
            MAIN_BRUSH: 3
        }
    },
    DND: {
        ID: 20,
        PROPERTIES: {
            ENABLED: 1,
            START: 2,
            END: 3

        }
    }
});

class DreameFanSpeedControlCapability extends FanSpeedControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setIntensity(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            await this.robot.sendCommand("set_properties", [
                {
                    did: this.robot.deviceId,
                    siid: SERVICES.CORE_VACUUM.ID,
                    piid: SERVICES.CORE_VACUUM.PROPERTIES.FAN_SPEED,
                    value: matchedPreset.value
                }
            ]);
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = DreameFanSpeedControlCapability;