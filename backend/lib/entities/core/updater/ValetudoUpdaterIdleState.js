const ValetudoUpdaterState = require("./ValetudoUpdaterState");

class ValetudoUpdaterIdleState extends ValetudoUpdaterState {
    /**
     *
     * @param {object} options
     * @param {object} [options.metaData]
     *
     * @param {string} options.currentVersion The currently running valetudo version
     * @class
     */
    constructor(options) {
        super(options);

        this.currentVersion = options.currentVersion;
    }
}

module.exports = ValetudoUpdaterIdleState;
