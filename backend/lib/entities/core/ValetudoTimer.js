const crypto = require("crypto");
const SerializableEntity = require("../SerializableEntity");


class ValetudoTimer extends SerializableEntity {
    /**
     *  Timers are always in UTC
     *
     * @param {object} options
     * @param {string} [options.id] uuidv4
     * @param {boolean} options.enabled
     * @param {string} [options.label]
     * 
     * @param {Array<number>} options.dow Sunday = 0 because js
     * @param {number} options.hour 0-23
     * @param {number} options.minute 0-59
     * 
     * @param {object} options.action
     * @param {ValetudoTimerActionType} options.action.type
     * @param {object} options.action.params
     * @param {Array<string>} [options.action.params.segment_ids]
     * @param {number} [options.action.params.iterations]
     * @param {boolean} [options.action.params.custom_order]
     * 
     * @param {Array<ValetudoTimerPreActionDefinition>} [options.pre_actions]
     * 
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.id = options.id ?? crypto.randomUUID();
        this.enabled = options.enabled;

        if (typeof options.label === "string" && options.label.length > 0) {
            this.label = options.label.substring(0, 24);
        }


        this.dow = [...options.dow].sort((a,b) => {
            return a - b;
        });
        this.hour = options.hour;
        this.minute = options.minute;

        this.action = options.action;
        this.pre_actions = options.pre_actions;
    }
}

/**
 *  @typedef {string} ValetudoTimerActionType
 *  @enum {string}
 *
 */
ValetudoTimer.ACTION_TYPE = Object.freeze({
    FULL_CLEANUP: "full_cleanup",
    SEGMENT_CLEANUP: "segment_cleanup"
});

/**
 *  @typedef {string} ValetudoTimerPreActionType
 *  @enum {string}
 *
 */
ValetudoTimer.PRE_ACTION_TYPE = Object.freeze({
    FAN_SPEED_CONTROL: "fan_speed_control",
    WATER_USAGE_CONTROL: "water_usage_control",
    OPERATION_MODE_CONTROL: "operation_mode_control"
});

/**
 * @typedef {object} ValetudoTimerPreActionDefinition
 *
 * @property {ValetudoTimerPreActionType} type
 * @property {object} params
 * @property {string} params.value
 * 
 */

module.exports = ValetudoTimer;
