const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class WifiConfigurationCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<import("../../entities/core/ValetudoWifiConfiguration")>}
     */
    async getWifiConfiguration() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {import("../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        throw new NotImplementedError();
    }

    getType() {
        return WifiConfigurationCapability.TYPE;
    }
}

WifiConfigurationCapability.TYPE = "WifiConfigurationCapability";

module.exports = WifiConfigurationCapability;