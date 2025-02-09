const NotImplementedError = require("../../../core/NotImplementedError");
const spawnSync = require("child_process").spawnSync;
const Tools = require("../../../utils/Tools");
const ValetudoWifiStatus = require("../../../entities/core/ValetudoWifiStatus");
const WifiConfigurationCapability = require("../../../core/capabilities/WifiConfigurationCapability");

/**
 * @template {import("../../../core/ValetudoRobot")} T
 * @extends WifiConfigurationCapability<T>
 */
class LinuxWifiConfigurationCapability extends WifiConfigurationCapability {
    /**
     * @param {object} options
     * @param {T} options.robot
     * @param {string} options.networkInterface
     *
     */
    constructor(options) {
        super(options);

        this.networkInterface = options.networkInterface;
    }

    /**
     * @returns {Promise<ValetudoWifiStatus>}
     */
    async getWifiStatus() {
        if (this.robot.config.get("embedded") !== true) {
            throw new NotImplementedError("Linux Wi-Fi configuration capability only works on the robot itself");
        }

        /*
            root@rockrobo:~# iw
            Usage:  iw [options] command
            Do NOT screenscrape this tool, we don't consider its output stable.

            :-)
         */
        const iwOutput = spawnSync("iw", ["dev", this.networkInterface, "link"]);
        const wifiStatus = this.parseIwStdout(iwOutput.stdout?.toString() || "");

        //IPs are not part of the iw output
        if (wifiStatus.state === ValetudoWifiStatus.STATE.CONNECTED) {
            wifiStatus.details.ips = Tools.GET_CURRENT_HOST_IP_ADDRESSES().sort().filter(ip => {
                return ip !== "127.0.0.1" && ip !== "::1";
            });
        }

        return wifiStatus;
    }

    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     * @abstract
     */
    async setWifiConfiguration(wifiConfig) {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {string} stdout
     * @return {ValetudoWifiStatus}
     */
    parseIwStdout(stdout) {
        const output = {
            state: ValetudoWifiStatus.STATE.UNKNOWN,
            details: {}
        };

        const connectedMatch = stdout.match(WIFI_CONNECTED_IW_REGEX);
        if (connectedMatch) {
            output.state = ValetudoWifiStatus.STATE.CONNECTED;
            output.details.bssid = connectedMatch.groups.bssid.trim();

            stdout.split("\n").splice(1).forEach(line => {
                const lineMatch = line.match(WIFI_CONNECTED_TUPLE_REGEX);

                if (lineMatch) {
                    switch (lineMatch.groups.key.trim()) {
                        case "SSID":
                            output.details.ssid = lineMatch.groups.value.trim();

                            break;
                        case "tx bitrate": {
                            const numberMatch = lineMatch.groups.value.match(NUMBER_REGEX);

                            if (numberMatch) {
                                output.details.upspeed = parseFloat(numberMatch.groups.number);
                            }

                            break;
                        }
                        case "signal": {
                            const numberMatch = lineMatch.groups.value.match(NUMBER_REGEX);

                            if (numberMatch) {
                                output.details.signal = parseFloat(numberMatch.groups.number);
                            }

                            break;
                        }

                    }
                }
            });

            output.details.frequency = ValetudoWifiStatus.FREQUENCY_TYPE.W2_4Ghz;
        } else if (stdout.trim().match(WIFI_NOT_CONNECTED_IW_REGEX)) {
            output.state = ValetudoWifiStatus.STATE.NOT_CONNECTED;
        }

        return new ValetudoWifiStatus(output);
    }
}

const WIFI_CONNECTED_IW_REGEX = /^Connected to (?<bssid>[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2})/;
const WIFI_CONNECTED_TUPLE_REGEX = /(?<key>[a-zA-Z\s]+): (?<value>.*)/;
const WIFI_NOT_CONNECTED_IW_REGEX = /^Not connected\.$/;
const NUMBER_REGEX = /(?<number>[-0-9.]+)/;

module.exports = LinuxWifiConfigurationCapability;
