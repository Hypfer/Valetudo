const Semaphore = require("semaphore");
const spawn = require("child_process").spawn;
const ValetudoWifiNetwork = require("../../../entities/core/ValetudoWifiNetwork");
const WifiScanCapability = require("../../../core/capabilities/WifiScanCapability");

/**
 * @template {import("../../../core/ValetudoRobot")} T
 * @extends WifiScanCapability<T>
 */
class LinuxWifiScanCapability extends WifiScanCapability {
    /**
     * @param {object} options
     * @param {T} options.robot
     * @param {string} options.networkInterface
     *
     */
    constructor(options) {
        super(options);

        this.networkInterface = options.networkInterface;

        /*
            As Wi-Fi scans may take up to a minute in some cases, we have to keep track of
            previous results to be able to respond with _something_ within a reasonable amount of time

            If the scan doesn't finish within ~2s we just send an older result
            We also update the cache in the background when the scan eventually decides to finish
            so that the result will be available next time

            Moreover, we only allow one concurrent scanning process
         */
        /** @type {Array<ValetudoWifiNetwork>} */
        this.cache = [];

        this.mutex = Semaphore(1);
    }

    /**
     * @returns {Promise<Array<ValetudoWifiNetwork>>}
     */
    scan() {
        return new Promise((resolve) => {
            if (this.mutex.available(1)) {
                let resolved = false;

                //return a cached result
                let timeout = setTimeout(() => {
                    resolved = true;

                    resolve(this.cache);
                }, MAX_SCAN_TIME);

                this.mutex.take(() => {
                    let scanOutputChunksLength = 0;
                    const scanOutputChunks = [];
                    const scanProcess = spawn("iw", ["dev", this.networkInterface, "scan"]);

                    scanProcess.stdout.on("data", (data) => {
                        // Limit the maximum amount of stdout data stored in memory
                        if (data?.length && (scanOutputChunksLength + data.length < MAX_OUTPUT_LENGTH)) {
                            scanOutputChunksLength += data.length;
                            scanOutputChunks.push(data);
                        }
                    });

                    scanProcess.on("close", () => {
                        this.mutex.leave();

                        let scanOutput = "";
                        scanOutputChunks.forEach(c => {
                            scanOutput += c.toString();
                        });

                        this.cache = this.parseScanData(scanOutput);

                        if (!resolved) {
                            clearTimeout(timeout);

                            resolve(this.cache);
                        }
                    });
                });
            } else {
                //This should be less confusing for API consumers than an instantly returning scan
                setTimeout(() => {
                    resolve(this.cache);
                }, MAX_SCAN_TIME/2);
            }
        });
    }

    /**
     * @private
     * @param {string} scanOutput
     * @returns {Array<ValetudoWifiNetwork>}
     */
    parseScanData(scanOutput) {
        const networks = [];

        scanOutput.split(/^BSS /m).forEach(station => {
            if (station === "") {
                return;
            }

            const mappedStation = {
                details: {}
            };

            station.split("\n").some(line => {
                //abort if we have everything to avoid useless regex evaluation
                if (
                    mappedStation.bssid !== undefined &&
                    mappedStation.details.signal !== undefined &&
                    mappedStation.details.ssid !== undefined
                ) {
                    return true;
                }
                const trimmedLine = line.trim();


                let match = trimmedLine.match(BSSID_REGEX);

                if (match) {
                    mappedStation.bssid = match.groups.bssid;

                    return;
                }

                match = trimmedLine.match(SIGNAL_REGEX);

                if (match) {
                    mappedStation.details.signal = parseFloat(match.groups.signal);

                    return;
                }


                match = trimmedLine.match(SSID_REGEX);

                if (match) {
                    mappedStation.details.ssid = match.groups.ssid;

                    return;
                }
            });

            /*
                This is limited to prevent an attacker spamming fake beacons from
                filling up our cache with nonsense, potentially exhausting memory
             */
            if (mappedStation.bssid !== undefined && networks.length < MAX_NETWORK_COUNT) {
                networks.push(new ValetudoWifiNetwork({
                    bssid: mappedStation.bssid,
                    details: mappedStation.details
                }));
            }
        });

        return networks;
    }
}

const MAX_SCAN_TIME = 2200;
const MAX_NETWORK_COUNT = 50;
const MAX_OUTPUT_LENGTH = 128 * 1024; //128 KiB

const BSSID_REGEX = /^(?<bssid>[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2}:[\da-f]{2})/;
const SSID_REGEX = /^SSID: (?<ssid>.+)$/;
const SIGNAL_REGEX = /^signal: (?<signal>.+) dBm$/;


module.exports = LinuxWifiScanCapability;
