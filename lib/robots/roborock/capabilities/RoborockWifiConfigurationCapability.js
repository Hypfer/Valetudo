const LinuxWifiConfigurationCapability = require("../../common/linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

class RoborockWifiConfigurationCapability extends LinuxWifiConfigurationCapability {

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

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        if (
            wifiConfig && wifiConfig.ssid && wifiConfig.credentials &&
            wifiConfig.credentials.type === ValetudoWifiConfiguration.CREDENTIALS_TYPE.WPA2_PSK &&
            wifiConfig.credentials.typeSpecificSettings && wifiConfig.credentials.typeSpecificSettings.password
        ) {
            await this.robot.sendCommand("miIO.config_router", {
                "ssid": wifiConfig.ssid,
                "passwd": wifiConfig.credentials.typeSpecificSettings.password,
                "uid": 0,
                "cc": "de",
                "country_domain": "de",
                "config_type": "app"
            }, {});
        } else {
            throw new Error("Invalid wifiConfig");
        }
    }
}

module.exports = RoborockWifiConfigurationCapability;
