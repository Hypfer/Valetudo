const LinuxWifiConfigurationCapability = require("../../common/linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

/**
 * @extends LinuxWifiConfigurationCapability<import("../CecotecCongaRobot")>
 */
class CecotecWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
    getWifiInterface() {
        return "wlan0";
    }

    /**
     * @returns {Promise<ValetudoWifiConfiguration>}
     */
    async getWifiConfiguration() {
        if (this.robot.config.get("embedded") === true) {
            return await super.getWifiConfiguration();
        }

        throw new Error("Cannot get Wi-Fi configuration for Cecotec vacuums");
    }

    /**
     * @returns {Promise<void>}
     */
    async setWifiConfiguration() {
        throw new Error("Cannot set Wi-Fi configuration for Cecotec vacuums");
    }
}

module.exports = CecotecWifiConfigurationCapability;
