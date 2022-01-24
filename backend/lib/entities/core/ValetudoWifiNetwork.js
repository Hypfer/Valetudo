const SerializableEntity = require("../SerializableEntity");

/**
 * Further extensions could e.g., contain the channel used
 */

class ValetudoWifiNetwork extends SerializableEntity {
    /**
     * @param {object} options
     * @param {string} options.bssid
     * @param {object} options.details
     * @param {string} [options.details.ssid]
     * @param {number} [options.details.signal] unit: dBm
     * @param {object} [options.metaData]
     *
     * @class
     */
    constructor(options) {
        super(options);

        this.bssid = options.bssid;
        this.details = options.details;
    }
}

module.exports = ValetudoWifiNetwork;
