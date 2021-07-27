const SerializableEntity = require("../../entities/SerializableEntity");
const uuid = require("uuid");

class ValetudoEvent extends SerializableEntity {
    /**
     * The base class of all events that might occur during runtime.
     * All of these are mere DTOs with logic being handled by the corresponding EventHandler
     *
     * @param {object}   options
     * @param {string}  [options.id]
     * @param {Date}    [options.timestamp]
     * @param {boolean} [options.processed]
     * @param {object}  [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.id = options.id ?? uuid.v4();
        this.timestamp = options.timestamp ?? new Date();
        this.processed = options.processed ?? false;
    }
}


module.exports = ValetudoEvent;
