const SerializableEntity = require("../SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoWifiConfiguration:
 *       type: object
 *       properties:
 *         ssid:
 *           type: string
 *           description: "Wireless network name"
 *         credentials:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             typeSpecificSettings:
 *               type: object
 *               description: "Settings depending on type, for example WPA preshared key"
 *         details:
 *           type: object
 *           properties:
 *             state:
 *               type: string
 *               enum:
 *                 - connected
 *                 - not_connected
 *                 - unknown
 *             downspeed:
 *               type: number
 *             upspeed:
 *               type: number
 *             signal:
 *               type: number
 *             ips:
 *               type: array
 *               description: "IP addresses"
 *               items:
 *                 type: string
 *             frequency:
 *               type: string
 *               enum:
 *                 - 2.4ghz
 *                 - 5ghz
 *         metaData:
 *           type: object
 *
 */

// noinspection JSCheckFunctionSignatures
class ValetudoWifiConfiguration extends SerializableEntity {
    /**
     * @param {object} options
     * @param {string} [options.ssid]
     * @param {object} [options.credentials]
     * @param {ValetudoWifiConfigurationCredentialsType} options.credentials.type
     * @param {object} options.credentials.typeSpecificSettings //e.g. key or user/password
     * @param {object} [options.details]
     * @param {ValetudoWifiConfigurationState} [options.details.state]
     * @param {number} [options.details.downspeed] unit: mbps
     * @param {number} [options.details.upspeed] unit: mbps
     * @param {number} [options.details.signal] unit: dBm
     * @param {Array<string>} [options.details.ips] all the ips that we can find
     * @param {ValetudoWifiConfigurationFrequencyType} [options.details.frequency]
     * @param {object} [options.metaData]
     *
     * @class
     */
    constructor(options) {
        super(options);

        this.ssid = options.ssid;
        this.credentials = options.credentials;
        this.details = options.details;
    }
}

/**
 *  @typedef {string} ValetudoWifiConfigurationCredentialsType
 *  @enum {string}
 *
 */
ValetudoWifiConfiguration.CREDENTIALS_TYPE = Object.freeze({
    WPA2_PSK: "wpa2_psk"
});

/**
 *  @typedef {string} ValetudoWifiConfigurationFrequencyType
 *  @enum {string}
 *
 */
ValetudoWifiConfiguration.FREQUENCY_TYPE = Object.freeze({
    W2_4Ghz: "2.4ghz", //cannot start with a number. therefore prefixed with w
    W5Ghz: "5ghz"
});

/**
 *  @typedef {string} ValetudoWifiConfigurationState
 *  @enum {string}
 *
 */
ValetudoWifiConfiguration.STATE = Object.freeze({
    CONNECTED: "connected",
    NOT_CONNECTED: "not_connected",
    UNKNOWN: "unknown"
});


module.exports = ValetudoWifiConfiguration;
