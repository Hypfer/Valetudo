const LinuxWifiConfigurationCapability = require("../../common/linuxCapabilities/LinuxWifiConfigurationCapability");
const ValetudoWifiStatus = require("../../../entities/core/ValetudoWifiStatus");

/**
 * @extends LinuxWifiConfigurationCapability<import("../MockRobot")>
 */
class MockWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
     */
    constructor(options) {
        super(options);
        this.connected = true;
        this.ssid = "Valetudo WiFi";
    }

    getWifiInterface() {
        return "wlan0";
    }

    /**
     * @returns {Promise<ValetudoWifiStatus>}
     */
    async getWifiStatus() {
        if (this.robot.config.get("embedded") === true) {
            return super.getWifiStatus();
        }

        const output = {
            state: this.connected ? ValetudoWifiStatus.STATE.CONNECTED : ValetudoWifiStatus.STATE.NOT_CONNECTED,
            details: {}
        };

        if (this.connected) {
            Object.assign(output.details, {
                signal: Math.floor(-20 - 40 * Math.random()),
                upspeed: 72.2,
                downspeed: 54,
                ips: ["192.168.100.100"],
                frequency: ValetudoWifiStatus.FREQUENCY_TYPE.W2_4Ghz,
                ssid: this.ssid
            });
        }

        return new ValetudoWifiStatus(output);
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        this.ssid = wifiConfig.ssid;
        this.connected = false;
        setTimeout(() => {
            this.connected = true;
        }, 10 * 1000);
    }
}

module.exports = MockWifiConfigurationCapability;
