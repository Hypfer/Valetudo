const LinuxWifiConfigurationCapability = require("../../common/linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

/**
 * @extends LinuxWifiConfigurationCapability<import("../MockRobot")>
 */
class MockWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
    constructor(options) {
        super(options);
        this.connected = true;
        this.ssid = "Valetudo WiFi";
    }

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
                state: this.connected ?
                    ValetudoWifiConfiguration.STATE.CONNECTED :
                    ValetudoWifiConfiguration.STATE.NOT_CONNECTED,
            },
        };

        if (this.connected) {
            Object.assign(output.details, {
                signal: Math.floor(-20 - 40 * Math.random()),
                upspeed: 72.2,
                downspeed: 54,
                ips: ["192.168.100.100"],
                frequency: ValetudoWifiConfiguration.FREQUENCY_TYPE.W2_4Ghz,
            });
            output.ssid = this.ssid;
        }

        return new ValetudoWifiConfiguration(output);
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        this.ssid = wifiConfig.ssid;
        this.connected = false;
        setTimeout(() => this.connected = true, 10 * 1000);
    }
}

module.exports = MockWifiConfigurationCapability;
