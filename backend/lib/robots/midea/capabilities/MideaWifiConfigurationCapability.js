const LinuxWifiConfigurationCapability = require("../../common/linuxCapabilities/LinuxWifiConfigurationCapability");
const Logger = require("../../../Logger");
const MSmartProvisioningPacket = require("../../../msmart/MSmartProvisioningPacket");
const ValetudoWifiConfiguration = require("../../../entities/core/ValetudoWifiConfiguration");

const crypto = require("crypto");
const net = require("net");

const ProvisioningState = Object.freeze({
    CONNECTING: "connecting",
    GETTING_UUID: "getting_uuid",
    PROVISIONING: "provisioning",
    DONE: "done"
});

/**
 * The robot firmware is super fragile and does not at all handle us behaving any different from the real app
 * Hence, this got quite convoluted
 *
 * @extends LinuxWifiConfigurationCapability<import("../MideaValetudoRobot")>
 */
class MideaWifiConfigurationCapability extends LinuxWifiConfigurationCapability {
    /**
     * @param {import("../../../entities/core/ValetudoWifiConfiguration")} wifiConfig
     * @returns {Promise<void>}
     */
    async setWifiConfiguration(wifiConfig) {
        if (
            wifiConfig?.ssid !== undefined &&
            wifiConfig.credentials?.type === ValetudoWifiConfiguration.CREDENTIALS_TYPE.WPA2_PSK &&
            wifiConfig.credentials.typeSpecificSettings?.password !== undefined
        ) {
            await this.performFullProvisioningSequence(wifiConfig);
        } else {
            throw new Error("Invalid wifiConfig");
        }
    }

    /**
     * Not following this to the letter (including polling the UUID and waiting for the robot to close the connection)
     * bricks the firmware. It is _super_ brittle
     *
     * @private
     * @param {ValetudoWifiConfiguration} wifiConfig
     * @returns {Promise<void>}
     */
    performFullProvisioningSequence(wifiConfig) {
        const host = "127.0.0.1";
        const port = 9999;

        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let timeout;
            let state = ProvisioningState.CONNECTING;
            let dataBuffer = Buffer.alloc(0);

            const cleanup = () => {
                clearTimeout(timeout);
                client.removeAllListeners();
                client.destroy();
            };

            const fail = (err) => {
                Logger.warn("Provisioning failed", err);
                cleanup();
                reject(err);
            };

            const succeed = () => {
                Logger.debug("Provisioning successful.");

                cleanup();
                resolve();
            };

            client.on("error", (err) => {
                fail(new Error(`Connection error to ${host}:${port}. Error: ${err.message}`));
            });

            timeout = setTimeout(() => {
                // If we're not already done, fail with a timeout.
                if (state !== ProvisioningState.DONE) {
                    fail(new Error(`Operation timed out after 15 seconds. Current state: ${state}`));
                }
            }, 15000);

            client.on("close", () => {
                if (state !== ProvisioningState.DONE) {
                    fail(new Error(`Connection closed unexpectedly during state: ${state}`));
                }
            });

            client.connect(port, host, () => {
                Logger.debug(`WifiConfig State ${state} - Connected to ${host}:${port}. Transitioning to 'getting_uuid'.`);
                state = ProvisioningState.GETTING_UUID;

                const getUuidPacket = new MSmartProvisioningPacket({
                    commandId: MSmartProvisioningPacket.COMMAND_IDS.CMD_UUID_INFO,
                    payload: Buffer.from([0x00])
                });

                Logger.debug(`WifiConfig State ${state} - Sending 'Get UUID' request.`);
                client.write(getUuidPacket.toBytes());
            });

            client.on("data", (data) => {
                if (state === ProvisioningState.DONE) {
                    return;
                } // Don't process any further data after we're done

                dataBuffer = Buffer.concat([dataBuffer, data]);

                while (dataBuffer.length >= 7) {
                    if (dataBuffer[0] !== 0xEE || dataBuffer[1] !== 0x01) {
                        Logger.warn(`WifiConfig State ${state} - Desynchronized stream. Discarding byte ${dataBuffer[0].toString(16)}.`);
                        dataBuffer = dataBuffer.subarray(1);
                        continue;
                    }

                    // FIXME: Not ideal here, as it is knowledge/logic that should be encapsulated by the MSmartProvisioningPacket
                    const coreCommandLength = dataBuffer.readUInt16BE(4);
                    const totalPacketLength = 7 + coreCommandLength;

                    if (dataBuffer.length < totalPacketLength) {
                        break;
                    }

                    const packetToProcess = dataBuffer.subarray(0, totalPacketLength);
                    dataBuffer = dataBuffer.subarray(totalPacketLength);

                    try {
                        const responsePacket = MSmartProvisioningPacket.FROM_BYTES(packetToProcess);
                        Logger.debug(`WifiConfig State ${state} - Received and parsed packet with Command ID: ${responsePacket.commandId}`);

                        if (state === ProvisioningState.GETTING_UUID && responsePacket.commandId === MSmartProvisioningPacket.RESPONSE_IDS.CMD_UUID_INFO) {
                            if (responsePacket.payload.length > 1) {
                                Logger.debug(`WifiConfig State ${state} - Received full UUID response. Transitioning to 'provisioning'.`, responsePacket.payload);
                                state = ProvisioningState.PROVISIONING;

                                const payloadString = [
                                    wifiConfig.ssid,
                                    wifiConfig.credentials.typeSpecificSettings.password,
                                    "https://euprod.mzrobo.com/",
                                    "GMT+00:00",
                                    BigInt(`0x${crypto.randomBytes(8).toString("hex")}`).toString(),
                                    "1,13", // Wifi channel min-max
                                    "DE"
                                ].join("\n");

                                const provisioningPacket = new MSmartProvisioningPacket({
                                    commandId: MSmartProvisioningPacket.COMMAND_IDS.CMD_ALL_INFO,
                                    payload: Buffer.from(payloadString)
                                });

                                Logger.debug(`WifiConfig State ${state} - Sending provisioning data.`);
                                client.write(provisioningPacket.toBytes());
                            } else {
                                Logger.debug(`WifiConfig State ${state} - Ignoring ACK for UUID response.`);
                            }
                        } else if (state === ProvisioningState.PROVISIONING && responsePacket.commandId === MSmartProvisioningPacket.RESPONSE_IDS.CMD_ALL_INFO) {
                            if (responsePacket.payload[0] === 0x00) {
                                Logger.debug(`WifiConfig State ${state} - Received provisioning ack.`);
                                state = ProvisioningState.DONE;

                                // Resolve this ASAP, so that the UI can still receive feedback before the robot transitions from AP to STA mode
                                succeed();

                                return;
                            } else {
                                fail(new Error(`Robot acknowledged provisioning with error code: 0x${responsePacket.payload[0].toString(16)}`));

                                return;
                            }
                        } else {
                            Logger.debug(`WifiConfig State ${state} - Received unexpected but valid packet with ID ${responsePacket.commandId}. Ignoring.`);
                        }
                    } catch (e) {
                        fail(new Error(`Failed to parse response from robot. Error: ${e.message}`));

                        return;
                    }
                }
            });
        });
    }
}

// FIXME: the UUID is not a UUID but just an ID. But what does it mean? Where does it come from?

module.exports = MideaWifiConfigurationCapability;
