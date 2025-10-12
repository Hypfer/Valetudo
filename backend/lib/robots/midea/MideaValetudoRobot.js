const forge = require("node-forge");
const fs = require("fs");

const BEightParser = require("../../msmart/BEightParser");
const capabilities = require("./capabilities");
const dtos = require("../../msmart/dtos");
const DummyCloudCertManager = require("../../utils/DummyCloudCertManager");
const entities = require("../../entities");
const Logger = require("../../Logger");
const MideaMapParser = require("./MideaMapParser");
const MSmartConst = require("../../msmart/MSmartConst");
const MSmartDummycloud = require("../../msmart/MSmartDummycloud");
const MSmartPacket = require("../../msmart/MSmartPacket");
const ValetudoRobot = require("../../core/ValetudoRobot");
const stateAttrs = entities.state.attributes;
const LinuxTools = require("../../utils/LinuxTools");
const Tools = require("../../utils/Tools");
const ValetudoRobotError = require("../../entities/core/ValetudoRobotError");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const {DUMMY_CLIENT_CERT, DUMMY_CLIENT_KEY} = require("./MideaConst");

const CA_KEY_PATH = "/etc/ssl/valetudo/ca.key";
const CA_CERT_PATH = "/etc/ssl/valetudo/ca.pem";
const BIND_IP = "127.0.13.37";

/**
 * @abstract
 */
class MideaValetudoRobot extends ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {object} [options.waterGrades]
     * @param {boolean} [options.oldMapPollStyle]
     */
    constructor(options) {
        super(options);
        this.waterGrades = options.waterGrades ?? MideaValetudoRobot.WATER_GRADES;
        this.oldMapPollStyle = !!options.oldMapPollStyle;

        // FIXME: this breaks the build_docs script. Find a better solution
        if (!fs.existsSync(CA_KEY_PATH) || !fs.existsSync(CA_CERT_PATH)) {
            throw new Error("DustCA not found. Unable to mock the cloud.");
        }

        const caKey = forge.pki.privateKeyFromPem(fs.readFileSync(CA_KEY_PATH, "utf8"));
        const caCert = forge.pki.certificateFromPem(fs.readFileSync(CA_CERT_PATH, "utf8"));

        this.dummyCloudCertManager = new DummyCloudCertManager({ caKey: caKey, caCert: caCert });

        this.mapParser = new MideaMapParser();
        this.mapUpdateDebounceTimeout = null;

        this.dummycloud = new MSmartDummycloud({
            dummyCloudCertManager: this.dummyCloudCertManager,
            bindIP: BIND_IP,
            timeout: 5000,
            dummyClientCert: DUMMY_CLIENT_CERT,
            dummyClientKey: DUMMY_CLIENT_KEY,
            onIncomingCloudMessage: this.onIncomingCloudMessage.bind(this),
            onConnected: () => {
                // start polling the map after a brief delay of 3.5s
                setTimeout(() => {
                    return this.pollMap();
                }, 3500);
            },
            onHttpRequest: (req, res) => {
                return false; // TODO: is this really needed anymore?
            },
            onUpload: (type, data) => {
                this.handleMapUpdate(type, data).catch(err => {
                    Logger.warn(`Error while handling map update of type ${type}`, err);
                });
            },
            onEvent: (type, value) => {
                switch (type) {
                    case "11": // Could be cleanup process in %
                    case "13": // Could be cleanup done
                        // ignored (for now?)
                        break;
                    default:
                        Logger.info(`Received unknown event. Type '${type}'. Value '${value}'`);
                }

            }
        });

        this.ephemeralState = {
            work_status: undefined,
            error_type: undefined,
            error_desc: undefined,
            job_state: undefined,
            station_error_code: undefined
        };

        if (this.config.get("embedded") === true) {
            // On the J15, WiFi scanning takes multiple minutes. Therefore, the capability was omitted here

            this.registerCapability(new capabilities.MideaWifiConfigurationCapability({
                robot: this,
                networkInterface: "wlan0"
            }));
        }

        this.registerCapability(new capabilities.MideaFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(MideaValetudoRobot.FAN_SPEEDS).map(k => {
                return new ValetudoSelectionPreset({name: k, value: MideaValetudoRobot.FAN_SPEEDS[k]});
            })
        }));
        this.registerCapability(new capabilities.MideaOperationModeControlCapability({
            robot: this,
            presets: Object.keys(MideaValetudoRobot.OPERATION_MODES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: MideaValetudoRobot.OPERATION_MODES[k]});
            })
        }));
        this.registerCapability(new capabilities.MideaWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.waterGrades[k]});
            })
        }));

        [
            capabilities.MideaCurrentStatisticsCapability,
            capabilities.MideaLocateCapability,
            capabilities.MideaBasicControlCapability,
            capabilities.MideaDoNotDisturbCapability,
            capabilities.MideaSpeakerVolumeControlCapability,
            capabilities.MideaSpeakerTestCapability,
            capabilities.MideaMapResetCapability,
            capabilities.MideaMappingPassCapability,
            capabilities.MideaMapSegmentEditCapability,
            capabilities.MideaMapSegmentationCapability,
            capabilities.MideaZoneCleaningCapability,
            capabilities.MideaCombinedVirtualRestrictionsCapability,
            capabilities.MideaKeyLockCapability,
            capabilities.MideaAutoEmptyDockManualTriggerCapability,
            capabilities.MideaMopDockCleanManualTriggerCapability,
            capabilities.MideaMopDockDryManualTriggerCapability,
            capabilities.MideaMopDockMopAutoDryingControlCapability,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
        }));
    }

    async shutdown() {
        await super.shutdown();

        if (this.mapUpdateDebounceTimeout) {
            clearTimeout(this.mapUpdateDebounceTimeout);
            this.mapUpdateDebounceTimeout = null;
        }

        if (this.dummycloud) {
            await this.dummycloud.shutdown();
        }
    }

    startup() {
        super.startup();

        if (this.config.get("embedded") === true) {
            // The J12 starts up with a time in 1970, which is too old for our root CA
            const buildTimestamp = Tools.GET_BUILD_TIMESTAMP();
            if (buildTimestamp > new Date()) {
                // Assuming that time is linearly moving forward, this gives us a realistic lower bound
                LinuxTools.SET_TIME(buildTimestamp);

                Logger.info("Successfully set the robot time via the valetudo build timestamp to", buildTimestamp);
            }

            Logger.info(`Firmware Version: ${this.getFirmwareVersion() ?? "unknown"}`);
        }
    }

    /**
     * @protected
     * @param {import("../../msmart/MSmartPacket")} packet
     * @returns {boolean} True if the message was handled.
     */
    onIncomingCloudMessage(packet) {
        // There was a redundant condition here checking the deviceType of the packet to be 0xB8, which is _all of them_ in context of valetudo
        // It shall remain referenced as this comment to explain why it is called BEightParser
        const data = BEightParser.PARSE(packet);

        if (data instanceof dtos.MSmartStatusDTO) {
            this.parseAndUpdateState(data);

            return true;
        } else if (data instanceof dtos.MSmartActiveZonesDTO) {
            this.mapParser.update("evt_active_zones", data).catch(e => {
                Logger.warn("Error while handling active zones event", e);
            });

            return true;
        } else if (data instanceof dtos.MSmartErrorDTO) {
            Logger.debug("Received ErrorDTO. Should we do anything with it?", data);
            // FIXME: is it required to use it at all? Should we poll state when we see this?

            return true;
        } else if (data instanceof dtos.MSmartDockStatusDTO) {
            // FIXME: what to do with this?

            return true;
        } else if (data === "SKIP") {
            // FIXME: HACK!
            return true;
        }

        return false;
    }

    /**
     * @param {import("../../msmart/dtos/MSmartStatusDTO")} data
     */
    parseAndUpdateState(data) {
        if (data.battery_percent !== undefined) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                level: data.battery_percent
            }));
        }

        let statusNeedsUpdate = false;

        if (data.work_status !== undefined) {
            statusNeedsUpdate = true;
            this.ephemeralState.work_status = data.work_status;
        }
        if (data.error_type !== undefined) {
            statusNeedsUpdate = true;
            this.ephemeralState.error_type = data.error_type;
        }
        if (data.error_desc !== undefined) {
            statusNeedsUpdate = true;
            this.ephemeralState.error_desc = data.error_desc;
        }
        if (data.job_state !== undefined) {
            statusNeedsUpdate = true;
            this.ephemeralState.job_state = data.job_state;
        }
        if (data.station_error_code !== undefined) {
            statusNeedsUpdate = true;
            this.ephemeralState.station_error_code = data.station_error_code;
        }


        if (data.fan_level !== undefined) {
            let matchingFanSpeed = Object.keys(MideaValetudoRobot.FAN_SPEEDS).find(key => {
                return MideaValetudoRobot.FAN_SPEEDS[key] === data.fan_level;
            });

            if (matchingFanSpeed) {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                    type: stateAttrs.PresetSelectionStateAttribute.TYPE.FAN_SPEED,
                    value: matchingFanSpeed,
                    metaData: {
                        rawValue: data.fan_level
                    },
                }));
            } else {
                Logger.warn(`Received unknown fan_level ${data.fan_level}`);
            }
        }

        if (data.mopMode !== undefined) { // Mop mode 0 = vacuum & mop. Needs explicit check for !== undefined
            let matchingOperationMode = Object.keys(MideaValetudoRobot.OPERATION_MODES).find(key => {
                return MideaValetudoRobot.OPERATION_MODES[key] === data.mopMode;
            });

            if (matchingOperationMode) {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                    type: stateAttrs.PresetSelectionStateAttribute.TYPE.OPERATION_MODE,
                    value: matchingOperationMode,
                    metaData: {
                        rawValue: data.mopMode
                    },
                }));
            } else {
                Logger.warn(`Received unknown mopMode ${data.mopMode}`);
            }
        }

        if (data.water_level !== undefined) {
            let matchingWaterGrade = Object.keys(this.waterGrades).find(key => {
                return this.waterGrades[key] === data.water_level;
            });

            if (matchingWaterGrade) {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                    type: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE,
                    value: matchingWaterGrade,
                    metaData: {
                        rawValue: data.water_level
                    },
                }));
            } else {
                Logger.warn(`Received unknown water_level ${data.water_level}`);
            }
        }

        if (data.work_area !== undefined) {
            this.capabilities[capabilities.MideaCurrentStatisticsCapability.TYPE].currentStatistics.area = data.work_area * 10000;
        }
        if (data.work_time !== undefined) {
            this.capabilities[capabilities.MideaCurrentStatisticsCapability.TYPE].currentStatistics.time = data.work_time * 60;
        }

        if (data.station_work_status !== undefined) {
            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
                value: MideaValetudoRobot.DOCK_STATUS_MAP[data.station_work_status] ?? stateAttrs.DockStatusStateAttribute.VALUE.ERROR
            }));
        }

        if (data.has_mop !== undefined) {
            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
                type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
                attached: data.has_mop
            }));
        }



        if (statusNeedsUpdate) {
            if (MideaValetudoRobot.STATUS_MAP[this.ephemeralState.work_status]) {
                let statusValue = MideaValetudoRobot.STATUS_MAP[this.ephemeralState.work_status]?.value ?? stateAttrs.StatusStateAttribute.VALUE.ERROR;
                let statusFlag = MideaValetudoRobot.STATUS_MAP[this.ephemeralState.work_status]?.flag ?? stateAttrs.StatusStateAttribute.FLAG.NONE;
                let statusError;

                if (statusValue === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                    statusError = MideaValetudoRobot.MAP_ERROR_CODE(this.ephemeralState.error_type, this.ephemeralState.error_desc);
                } else if (this.ephemeralState.station_error_code > 0) {
                    statusValue = stateAttrs.StatusStateAttribute.VALUE.ERROR;
                    statusError = MideaValetudoRobot.MAP_DOCK_ERROR_CODE(this.ephemeralState.station_error_code);
                }

                if (
                    statusFlag === stateAttrs.StatusStateAttribute.FLAG.NONE &&
                    this.ephemeralState.job_state > 0 &&
                    [
                        stateAttrs.StatusStateAttribute.VALUE.DOCKED,
                        stateAttrs.StatusStateAttribute.VALUE.IDLE,
                        stateAttrs.StatusStateAttribute.VALUE.PAUSED,
                        stateAttrs.StatusStateAttribute.VALUE.ERROR,
                    ].includes(statusValue)
                ) {
                    statusFlag = stateAttrs.StatusStateAttribute.FLAG.RESUMABLE;
                }

                const newState = new stateAttrs.StatusStateAttribute({
                    value: statusValue,
                    flag: statusFlag,
                    metaData: {},
                    error: statusError
                });

                this.state.upsertFirstMatchingAttribute(newState);

                if (newState.isActiveState) {
                    this.pollMap();
                }
            } else {
                Logger.warn(`Received unknown work_status ${this.ephemeralState.work_status}`);
            }
        }

        // TODO: raise event when data.dustbag_full?

        // Emit state update event
        this.emitStateAttributesUpdated();
    }

    /**
     * @param {string|object} command
     * @param {object} [options]
     * @param {number} [options.timeout] - milliseconds
     * @param {"device"|"ai"|"map"} [options.target] - defaults to "device"
     * @param {boolean} [options.fireAndForget]
     * @returns {Promise<import("../../msmart/MSmartPacket")>}
     */
    async sendCommand(command, options) {
        return this.dummycloud.sendCommand(command, options);
    }

    async pollState() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(0x01)
        });

        const response = await this.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof dtos.MSmartStatusDTO) {
            this.parseAndUpdateState(parsedResponse);
        }

        return this.state;
    }

    /**
     *
     * @param {string} type - TODO: ENUM
     * @param {string} data
     * @return {Promise<void>}
     */
    async handleMapUpdate(type, data) {
        await this.mapParser.update(type, data);

        if (this.mapUpdateDebounceTimeout) {
            clearTimeout(this.mapUpdateDebounceTimeout);
        }

        this.mapUpdateDebounceTimeout = setTimeout(() => {
            const newMap = this.mapParser.getCurrentMap();
            if (newMap.metaData.totalLayerArea > 0) {
                this.state.map = newMap;

                this.emitMapUpdated();
            }

            this.mapUpdateDebounceTimeout = null;
        }, 350); // TODO: what to pick here?
    }

    async executeMapPoll() {
        // TODO: Should these all be new instances every single poll?
        const mapPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.POLL_MAP)
        });
        const dockPositionPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_DOCK_POSITION)
        });
        const activeZonesPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_ACTIVE_ZONES)
        });

        if (this.oldMapPollStyle) {
            await this.sendCommand({command: "start"}, {target: "map", fireAndForget: true});
        } else {
            await this.sendCommand(mapPollPacket.toHexString());
        }

        const dockPositionResponse = await this.sendCommand(dockPositionPollPacket.toHexString());

        if (dockPositionResponse.payload[3] === 1) {
            await this.mapParser.update("dockPosition", { // TODO: Move to BEightParser
                x: dockPositionResponse.payload.readUInt16LE(4),
                y: dockPositionResponse.payload.readUInt16LE(6),
                angle: dockPositionResponse.payload.readUInt16LE(8)
            });
        }

        const activeZonesResponse = await this.sendCommand(activeZonesPollPacket.toHexString());

        if (activeZonesResponse instanceof dtos.MSmartActiveZonesDTO) {
            await this.mapParser.update("evt_active_zones", activeZonesResponse);
        }
    }

    clearValetudoMap() {
        this.mapParser.reset();

        super.clearValetudoMap();
    }


    getManufacturer() {
        return "Midea";
    }

    getModelDetails() { // TODO: possibly belongs into the J15 implementation
        return Object.assign(
            {},
            super.getModelDetails(),
            {
                supportedAttachments: [
                    stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                ]
            }
        );
    }

    /**
     * @private
     * @returns {string|undefined}
     */
    getFirmwareVersion() {
        try {
            const version_conf = fs.readFileSync("/etc/version.conf").toString().trim();

            if (version_conf) {
                const splitVersionConf = version_conf.split("_");

                return splitVersionConf[splitVersionConf.length - 1];
            }
        } catch (e) {
            Logger.warn("Unable to determine the Firmware Version", e);
        }
    }

    /**
     * @return {object}
     */
    getProperties() {
        const superProps = super.getProperties();
        const ourProps = {};

        if (this.config.get("embedded") === true) {
            const firmwareVersion = this.getFirmwareVersion();

            if (firmwareVersion) {
                ourProps[MideaValetudoRobot.WELL_KNOWN_PROPERTIES.FIRMWARE_VERSION] = firmwareVersion;
            }
        }

        return Object.assign(
            {},
            superProps,
            ourProps
        );
    }
}

MideaValetudoRobot.FAN_SPEEDS = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.OFF]: 0,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MIN]: 4,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 3,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MAX]: 5
});

MideaValetudoRobot.OPERATION_MODES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM_AND_MOP]: 0,
    [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM]: 1,
    [stateAttrs.PresetSelectionStateAttribute.MODE.MOP]: 2,
    [stateAttrs.PresetSelectionStateAttribute.MODE.VACUUM_THEN_MOP]: 3,
});

MideaValetudoRobot.WATER_GRADES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 3,
});

MideaValetudoRobot.HIGH_RESOLUTION_WATER_GRADES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MIN]: 101,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 108,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 115,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 120, // J15pu default
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MAX]: 130,
});

MideaValetudoRobot.STATUS_MAP = Object.freeze({
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED,
        flag: stateAttrs.StatusStateAttribute.FLAG.RESUMABLE
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING,
        flag: stateAttrs.StatusStateAttribute.FLAG.MAPPING
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    14: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    15: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED,
        flag: stateAttrs.StatusStateAttribute.FLAG.RESUMABLE
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    17: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    18: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    19: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING
    },
    20: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED,
        flag: stateAttrs.StatusStateAttribute.FLAG.RESUMABLE
    },
    21: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED,
        flag: stateAttrs.StatusStateAttribute.FLAG.RESUMABLE
    },
    22: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING
    },
    23: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    }
});

MideaValetudoRobot.DOCK_STATUS_MAP = Object.freeze({
    0: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,       // "station_free"
    1: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,       // "charging_on_dock"
    2: stateAttrs.DockStatusStateAttribute.VALUE.CLEANING,   // "water_injection"
    3: stateAttrs.DockStatusStateAttribute.VALUE.CLEANING,   // "cleaning_cloth"
    4: stateAttrs.DockStatusStateAttribute.VALUE.DRYING,     // "rag_drying"
    5: stateAttrs.DockStatusStateAttribute.VALUE.DRYING,     // "rag_air_drying"
    6: stateAttrs.DockStatusStateAttribute.VALUE.ERROR,      // "station_error"
    7: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,       // "charge_finish"
    8: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,       // "sleep_in_station"
    9: stateAttrs.DockStatusStateAttribute.VALUE.CLEANING,   // "auto_clean"
    10: stateAttrs.DockStatusStateAttribute.VALUE.EMPTYING,  // "dusting"
    11: stateAttrs.DockStatusStateAttribute.VALUE.CLEANING,  // "hair_cutting"
    12: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "wait_for_charging"
    13: stateAttrs.DockStatusStateAttribute.VALUE.CLEANING,  // "drain_water"
    48: stateAttrs.DockStatusStateAttribute.VALUE.PAUSE,     // "default_sleep" - TODO: think about all the pause ones
    49: stateAttrs.DockStatusStateAttribute.VALUE.PAUSE,     // "work_pause_sleep"
    50: stateAttrs.DockStatusStateAttribute.VALUE.PAUSE,     // "stop_sleep"
    51: stateAttrs.DockStatusStateAttribute.VALUE.PAUSE,     // "charge_pause_sleep"
    52: stateAttrs.DockStatusStateAttribute.VALUE.PAUSE,     // "back_pause_sleep"
    53: stateAttrs.DockStatusStateAttribute.VALUE.PAUSE,     // "cruise_pause_sleep"

    80: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "default_relocate" - TODO: why does the stationary dock even has relocate status?
    81: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "first_start_relocate"
    82: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "wheel_raised_relocate"
    83: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "odometer_data_changes_relocate"
    84: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "imu_data_changes_relocate"
    85: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "delete_current_map_relocate"
    86: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "enter_distress_relocate"
    87: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "map_exchage_relocate"
    88: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "after_manualcontorl_relocate"
    89: stateAttrs.DockStatusStateAttribute.VALUE.IDLE,      // "outof_map_range_relocate"
});

/**
 *
 * @param {number} errorType - Error category (1=solvable, 2=restart, 3=alert)
 * @param {number} errorDesc - Specific error code within the category
 *
 * @returns {ValetudoRobotError}
 */
MideaValetudoRobot.MAP_ERROR_CODE = (errorType, errorDesc) => { // TODO: review these by hand
    const vendorErrorCode = `${errorType}-${errorDesc}`;
    const parameters = {
        severity: {
            kind: ValetudoRobotError.SEVERITY_KIND.UNKNOWN,
            level: ValetudoRobotError.SEVERITY_LEVEL.UNKNOWN,
        },
        subsystem: ValetudoRobotError.SUBSYSTEM.UNKNOWN,
        message: `Unknown error ${vendorErrorCode}`,
        vendorErrorCode: vendorErrorCode
    };

    if (errorType === 1) { // Solvable errors
        switch (errorDesc) {
            case 1: // DUST_BOX_MISSING
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Dustbin missing";
                break;
            case 2: // WHEELS_DANGLING
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                parameters.message = "Wheel lost floor contact";
                break;
            case 3: // WHEELS_OVERLOAD
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                parameters.message = "Wheel jammed";
                break;
            case 4: // SIDE_BRUSH_FAULT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                parameters.message = "Side brush jammed";
                break;
            case 5: // ROLLING_BRUSH_FAULT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                parameters.message = "Main brush jammed";
                break;
            case 6: // DUST_MOTOR_OVERLOAD
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                parameters.message = "Fan speed abnormal";
                break;
            case 7: // FRONT_PANEL_FAULT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "Stuck front bumper";
                break;
            case 8: // RADAR_MASK
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS jammed";
                break;
            case 9: // FRONT_SENSOR_FAULT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "Cliff sensor dirty or robot on the verge of falling";
                break;
            case 10: // BATTERY_VERY_LOW_HIT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Low battery";
                break;
            case 11: // LEAN_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "Tilted robot";
                break;
            case 12: // LASER_SENSOR_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS jammed";
                break;
            case 13: // EDGE_SENSOR_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "Sensor dirty";
                break;
            case 14: // FIND_BARRIER
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot trapped by virtual restrictions";
                break;
            case 15: // MAGNETIC_FIELD_DISTURB
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "Magnetic interference";
                break;
            case 16: // LASER_SENSOR_BLOCK_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS bumper jammed";
                break;
            case 17: // MOP_LOSE_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Lost mop pad";
                break;
            case 18: // MOP_SLIP_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot stuck or trapped";
                break;
            case 19: // RECHARGE_FAIL
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Charging station without power";
                break;
            case 20: // VIBRATION_DRAG_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot stuck or trapped";
                break;
            case 21: // STERILIZATION_MODULE_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Sterilization module fault";
                break;
            case 22: // ROBOT_WATER_BOX_UNINSTALL_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Water tank missing";
                break;
            case 23: // WIPE_CHIP_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Wipe chip error";
                break;
            case 24: // RADAR_HIGH_TEMPERATURE
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS temperature out of operating range";
                break;
            case 32: // HAIR_CUT_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
                parameters.message = "Hair cutter jammed";
                break;
            case 43: // RECHARGE_FAIL (specific variant)
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Charging error";
                break;
            case 64: // MOP_DROP_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Lost mop pad";
                break;
            case 65: // ROATE_TIME_OUT_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Rotation timeout";
                break;
            case 66: // CANNOT_FIND_STATION
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot navigate to the dock";
                break;
            case 67: // RECHARGE_FAIL (another variant)
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Charging error";
                break;
            case 68: // RECHARGE_FAIL_NOSINGAL
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Charging station without power";
                break;
            case 69: // RADAR_HIGH_TEMPERATURE_RESOLVE_FAILED
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS temperature control failed";
                break;
            case 80: // CANNOT_ARRIVE_POINT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot reach target";
                break;
            case 81: // PHS_FIND_BARRIER
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot trapped by virtual restrictions";
                break;
            case 82: // FIND_BARRIER
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot trapped by virtual restrictions";
                break;
            case 83: // WHEELS_DANGLING
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                parameters.message = "Wheel lost floor contact";
                break;
            case 84: // ROBOT_OUT_STATION_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot failed to exit dock";
                break;
            case 85: // ROBOT_BEING_TRAPPED
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot stuck or trapped";
                break;
            case 87: // ROBOT_TIMEOUT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                parameters.message = "Robot operation timeout";
                break;
            case 88: // CARPET_START_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot start on carpet";
                break;
            case 89: // VM_WALL_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Stuck inside restricted area";
                break;
            case 90: // FORBIDDEN_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Stuck inside restricted area";
                break;
            case 91: // MOP_FORBIDDEN_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Stuck inside restricted area";
                break;
            case 92: // CHARGE_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot start while charging";
                break;
            case 93: // ROBOT_BEING_TRAPPED
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot stuck or trapped";
                break;
            case 94: // ROBOT_SLAM_LAYER_EMPTY
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Navigation map error";
                break;
            case 96: // DEPART_FROM_NARROW_AREA_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot stuck in narrow area";
                break;
            case 128: // ROBOT_CREATE_MAP_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Map creation error";
                break;
            case 160: // RADAR_HIGH_TEMPERATURE_RESOLVE_FAILED
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS temperature control failed";
                break;
            case 162: // ROBOT_CREATE_MAP_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Map creation error";
                break;
            case 164: // SLAM_LOCATION_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Localization error";
                break;
        }
    } else if (errorType === 2) { // Restart errors
        switch (errorDesc) {
            case 1: // LASER_COM_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "LDS communication error";
                break;
            case 2: // MAINFRAME_COM_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
                parameters.message = "Mainframe communication error";
                break;
        }
    } else if (errorType === 3) { // Alert errors
        switch (errorDesc) {
            case 1: // LOCATION_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Localization error";
                break;
            case 2: // BATTERY_LOW_HIT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Low battery";
                break;
            case 3: // DUST_BOX_FULL
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Dustbin full";
                break;
            case 4: // WATER_BOX_LACK
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Water tank empty";
                break;
            case 5: // RECHARGE_FAIL
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
                parameters.message = "Charging error";
                break;
            case 6: // SENSOR_DIRTY_MSG
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
                parameters.message = "Sensor dirty";
                break;
            case 8: // MOP_LIFT_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Mop lift error";
                break;
            case 9: // DUST_INTERUPT_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock dust collection interrupted";
                break;
            case 10: // DUST_BOX_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock dust collection error";
                break;
            case 11: // DUST_OPENED_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock cover open or missing dust bag";
                break;
            case 12: // DUST_UNINSTALL_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock cover open or missing dust bag";
                break;
            case 13: // DUST_FULL_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock dust bag full or dust duct clogged";
                break;
            case 32: // CANNOT_ARRIVE_POINT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot reach target";
                break;
            case 33: // LOOK_DOWN_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot start in current position";
                break;
            case 34: // ON_CARPET_START_MODE
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Cannot start on carpet";
                break;
            case 35: // VM_WALL_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Stuck inside restricted area";
                break;
            case 37: // WATER_FORBIDDEN_AREA_START
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Stuck inside restricted area";
                break;
            case 100: // STATION_DISCONNECT
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock communication error";
                break;
            case 101: // ROBOT_NOT_IN_STATION
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
                parameters.message = "Robot not in dock";
                break;
            case 105: // WASH_WATER_BOX_UNINSTALL_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Mop Dock Clean Water Tank not installed";
                break;
            case 106: // CLEAN_WATER_TANK_WITHOUT_WATER_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Mop Dock Clean Water Tank empty";
                break;
            case 107: // STATION_CLOSE_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock close error";
                break;
            case 109: // STATION_FAN_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock fan error";
                break;
            case 111: // STATION_RAG_BOX_FULL_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Mop Dock Tray not installed";
                break;
            case 112: // ROBOT_WATER_BOX_FULL_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Mop Dock Tray full of water";
                break;
            case 114: // MOP_LOSE_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
                parameters.message = "Lost mop pad";
                break;
            case 117: // W11PLUS_STATION_NO_WATER_MODULE_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock water module not installed";
                break;
            case 121: // DUST_FULL_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock dust bag full or dust duct clogged";
                break;
            case 125: // STATION_COMMUNICATION_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock communication error";
                break;
            case 128: // STATION_COVER_NOT_CLOSE
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock cover not closed";
                break;
            case 129: // DUST_UNINSTALL_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Auto-Empty Dock cover open or missing dust bag";
                break;
            case 131: // W11PLUS_CLEANING_LIQUID_LACK_ERROR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock cleaning liquid empty";
                break;
            case 134: // WATER_INJECTION_TIMEOUT_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock water injection timeout";
                break;
            case 135: // FORTIFIED_LIQUID_LACK_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock fortified liquid empty";
                break;
            case 136: // WATER_LEVEL_SENSOR_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock water level sensor error";
                break;
            case 148: // AIR_MOTOR_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock air motor error";
                break;
            case 149: // MOTOR_RAISED_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock motor raise error";
                break;
            case 150: // MOTOR_DOWN_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock motor down error";
                break;
            case 151: // TEMPERATURE_COLLECTION_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock temperature sensor error";
                break;
            case 152: // DIRTY_TANK_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Mop Dock Wastewater Tank not installed or full";
                break;
            case 204: // STATION_COMMUNICATION_ERR
                parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
                parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
                parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
                parameters.message = "Dock communication error";
                break;
        }
    }

    return new ValetudoRobotError(parameters);
};

/**
 *
 * @param {number} dockErrorCode
 *
 * @returns {ValetudoRobotError}
 */
MideaValetudoRobot.MAP_DOCK_ERROR_CODE = (dockErrorCode) => {
    const parameters = {
        severity: {
            kind: ValetudoRobotError.SEVERITY_KIND.UNKNOWN,
            level: ValetudoRobotError.SEVERITY_LEVEL.UNKNOWN,
        },
        subsystem: ValetudoRobotError.SUBSYSTEM.UNKNOWN,
        message: `Unknown Dock error ${dockErrorCode}`,
        vendorErrorCode: typeof dockErrorCode === "number" ? dockErrorCode.toString() : `unknown (${dockErrorCode})`
    };

    switch (dockErrorCode) {
        case 106:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Clean Water Tank empty or not installed";
            break;
        case 152:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Wastewater Tank full or not installed";
            break;
    }

    return new ValetudoRobotError(parameters);
};

module.exports = MideaValetudoRobot;
