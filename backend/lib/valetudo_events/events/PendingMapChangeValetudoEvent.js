const ValetudoEvent = require("./ValetudoEvent");

class PendingMapChangeValetudoEvent extends ValetudoEvent {
    /**
     *
     * @param {object}   options
     * @param {object}  [options.metaData]
     * @class
     */
    constructor(options) {
        super(Object.assign({}, options, {id: "pending_map_change"}));
    }
}

module.exports = PendingMapChangeValetudoEvent;
