const ValetudoNTPClientState = require("./ValetudoNTPClientState");

class ValetudoNTPClientDisabledState extends ValetudoNTPClientState {
    /**
     * The NTP Client is disabled
     * 
     * @param {object} options
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);
    }
}

module.exports = ValetudoNTPClientDisabledState;
