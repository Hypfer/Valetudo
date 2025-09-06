const ValetudoWifiNetwork = require("../../../entities/core/ValetudoWifiNetwork");
const WifiScanCapability = require("../../../core/capabilities/WifiScanCapability");

function getRandomRSSI() {
    return (Math.round(Math.random() * 100) + 10) * -1;
}

/**
 * @extends WifiScanCapability<import("../MockValetudoRobot")>
 */
class MockWifiScanCapability extends WifiScanCapability {
    async scan() {
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, Math.round(Math.random() * 3000));
        });

        if (Math.random() > 0.78) {
            return [];
        }

        return [
            new ValetudoWifiNetwork({
                bssid: "23:CF:D7:E0:54:5E",
                details: {
                    ssid: "SingleAP",
                    signal: getRandomRSSI()
                }
            }),
            new ValetudoWifiNetwork({
                bssid: "2A:C4:FB:F5:EF:40",
                details: {
                    ssid: "MultiAP",
                    signal: getRandomRSSI()
                }
            }),
            new ValetudoWifiNetwork({
                bssid: "AA:A2:21:E8:38:B6",
                details: {
                    ssid: "MultiAP",
                    signal: getRandomRSSI()
                }
            }),
            new ValetudoWifiNetwork({
                bssid: "72:87:8F:9D:F1:66",
                details: {
                    ssid: "ThirtyTwo_CharacterSSID_SendHelp",
                    signal: getRandomRSSI()
                }
            }),
            new ValetudoWifiNetwork({
                bssid: "66:C6:C5:7D:96:88",
                details: {
                    ssid: "NoSignal",
                }
            }),
            new ValetudoWifiNetwork({
                bssid: "AE:02:EE:A8:00:7A",
                details: {
                    //no ssid
                    signal: getRandomRSSI()
                }
            }),
            new ValetudoWifiNetwork({
                bssid: "24:77:AF:A3:BF:96",
                details: {
                    //no details
                }
            }),
        ];
    }
}

module.exports = MockWifiScanCapability;
