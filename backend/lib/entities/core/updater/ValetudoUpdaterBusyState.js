const ValetudoUpdaterState = require("./ValetudoUpdaterState");

class ValetudoUpdaterBusyState extends ValetudoUpdaterState {
    /**
     *
     * @param {object} options
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);
    }
}

module.exports = ValetudoUpdaterBusyState;
