const SerializableEntity = require("../SerializableEntity");
const uuid = require("uuid");


class ValetudoTimer extends SerializableEntity {
    /**
     *  Timers are always in UTC
     *
     * @param {object} options
     * @param {string} [options.id] uuidv4
     * @param {boolean} options.enabled
     * @param {Array<number>} options.dow Sunday = 0 because js
     * @param {number} options.hour 0-23
     * @param {number} options.minute 0-59
     * @param {object} options.action
     * @param {ValetudoTimerActionType} options.action.type
     * @param {object} options.action.params
     * @param {Array<string>} [options.action.params.segment_ids]
     * @param {number} [options.action.params.iterations]
     * @param {boolean} [options.action.params.custom_order]
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.id = options.id ?? uuid.v4();
        this.enabled = options.enabled;
        this.dow = options.dow;
        this.hour = options.hour;
        this.minute = options.minute;
        this.action = options.action;
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


module.exports = ValetudoTimer;
