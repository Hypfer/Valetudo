const DismissibleValetudoEvent = require("./DismissibleValetudoEvent");

class ValetudoUpdatedValetudoEvent extends DismissibleValetudoEvent {
    /**
     *
     * @param {object}   options
     * @param {number}   options.generation
     * @param {string}   options.previousVersion
     * @param {string}   options.newVersion
     *
     * @param {string}  [options.id]
     * @param {Date}    [options.timestamp]
     * @param {boolean} [options.processed]
     * @param {object}  [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.previousVersion = options.previousVersion;
        this.newVersion = options.newVersion;
    }
}

module.exports = ValetudoUpdatedValetudoEvent;
