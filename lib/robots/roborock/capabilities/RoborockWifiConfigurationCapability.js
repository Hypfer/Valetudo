const MiioWifiConfigurationCapability = require("../../common/miioCapabilities/MiioWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

/**
 * @extends MiioWifiConfigurationCapability<import("../RoborockValetudoRobot")>
 */
class RoborockWifiConfigurationCapability extends MiioWifiConfigurationCapability {
    /**
     * @returns {Promise<ValetudoWifiConfiguration>}
     */
    async getWifiConfiguration() {
        if (this.robot.config.get("embedded") === true) {
            return await super.getWifiConfiguration();
        }

        const output = {
            details: {
                state: ValetudoWifiConfiguration.STATE.UNKNOWN
            }
        };

        let res = await this.robot.sendCommand("get_network_info");

        if (res !== "unknown_method") {
            if (typeof res === "object" && res.bssid !== "") {
                output.details.state = ValetudoWifiConfiguration.STATE.CONNECTED;

                output.details.signal = parseInt(res.rssi);
                output.details.ips = [res.ip];
                output.ssid = res.ssid;
                output.details.frequency = ValetudoWifiConfiguration.FREQUENCY_TYPE.W2_4Ghz;
            } else {
                output.details.state = ValetudoWifiConfiguration.STATE.NOT_CONNECTED;
            }
        }

        return new ValetudoWifiConfiguration(output);
    }
}

module.exports = RoborockWifiConfigurationCapability;
