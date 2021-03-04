const SerializableEntity = require("../SerializableEntity");

/**
 * @class ValetudoVoicePackOperationStatus
 * @property {ValetudoVoicePackOperationStatusType} type
 * @property {number} [progress]
 */
class ValetudoVoicePackOperationStatus extends SerializableEntity {
    /**
     * This entity represents the status of a voice pack operation.
     *
     * @param {object} options
     * @param {ValetudoVoicePackOperationStatusType} options.type
     * @param {number} [options.progress] represents the download or installation progress in the range 0-100
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.progress = options.progress;
    }
}


/**
 *  @typedef {string} ValetudoVoicePackOperationStatusType
 *  @enum {string}
 *
 */
ValetudoVoicePackOperationStatus.TYPE = Object.freeze({
    IDLE: "idle",
    DOWNLOADING: "downloading",
    INSTALLING: "installing",
});


module.exports = ValetudoVoicePackOperationStatus;