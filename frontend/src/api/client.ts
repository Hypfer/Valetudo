import axios from "axios";
import { RawMapData } from "./RawMapData";
import {PresetSelectionState, PresetValue, RobotAttribute} from "./RawRobotState";
import {
    AutoEmptyDockAutoEmptyInterval,
    AutoEmptyDockAutoEmptyIntervalPayload,
    AutoEmptyDockAutoEmptyIntervalProperties,
    Capability,
    CarpetSensorMode,
    CarpetSensorModeControlProperties,
    CarpetSensorModePayload,
    CombinedVirtualRestrictionsProperties,
    CombinedVirtualRestrictionsUpdateRequestParameters,
    ConsumableId,
    ConsumableProperties,
    ConsumableState,
    DoNotDisturbConfiguration,
    HighResolutionManualControlInteraction,
    HTTPBasicAuthConfiguration,
    LogLevelResponse,
    ManualControlInteraction,
    ManualControlProperties,
    MapSegmentationActionRequestParameters,
    MapSegmentationProperties,
    MapSegmentEditJoinRequestParameters,
    MapSegmentEditSplitRequestParameters,
    MapSegmentRenameRequestParameters,
    MopDockMopWashTemperature,
    MopDockMopWashTemperaturePayload,
    MopDockMopWashTemperatureProperties,
    MQTTConfiguration,
    MQTTProperties,
    MQTTStatus,
    NetworkAdvertisementConfiguration,
    NetworkAdvertisementProperties,
    NTPClientConfiguration,
    NTPClientStatus,
    ObstacleImagesProperties,
    Point,
    Quirk,
    RobotInformation,
    RobotProperties,
    Segment,
    SetLogLevelRequest,
    SetQuirkValueCommand,
    SimpleToggleState,
    SpeakerVolumeState,
    StatisticsProperties,
    SystemHostInfo,
    SystemRuntimeInfo,
    Timer,
    TimerInformation,
    TimerProperties,
    UpdaterConfiguration,
    UpdaterState,
    ValetudoCustomizations,
    ValetudoDataPoint,
    ValetudoEvent,
    ValetudoEventInteractionContext,
    ValetudoInformation,
    ValetudoVersion,
    ValetudoWifiNetwork,
    VoicePackManagementCommand,
    VoicePackManagementStatus,
    WifiConfiguration,
    WifiConfigurationProperties,
    WifiStatus,
    ZoneActionRequestParameters,
    ZoneProperties,
} from "./types";
import { floorObject } from "./utils";
import {preprocessMap} from "./mapUtils";
import ReconnectingEventSource from "reconnecting-eventsource";

export const valetudoAPIBaseURL = "./api/v2";
export const valetudoAPI = axios.create({
    baseURL: valetudoAPIBaseURL,
});

let currentCommitId = "unknown";

valetudoAPI.interceptors.response.use(response => {
    /*
       As using an outdated frontend with an updated backend might lead to undesirable
       or even catastrophic results, we try to automatically detect this state and
       act accordingly.
       By just looking at the response headers of any api request, we avoid additional
       periodic API requests for polling the current version.

       If something such as a reverse proxy strips these headers, the check will not work.
       Users of advanced setups like these should remember to press ctrl + f5 to force refresh
       after each Valetudo update
    */
    if (response.headers["x-valetudo-commit-id"]) {
        if (currentCommitId !== response.headers["x-valetudo-commit-id"]) {
            if (currentCommitId === "unknown") {
                currentCommitId = response.headers["x-valetudo-commit-id"];
            } else {
                /*
                    While we could display a textbox informing the user that the backend changed,
                    there wouldn't be any benefit to that as the refresh is mandatory anyway

                    By just calling location.reload() here, we avoid having to somehow inject the currentCommitId
                    value from this mostly stateless api layer into the React application state
                 */
                location.reload();
            }
        }
    }

    return response;
});

const SSESubscribers = new Map<string, () => () => void>();
const SSECleanupTimeouts = new Map<string, any>();

const subscribeToSSE = <T>(
    endpoint: string,
    event: string,
    listener: (data: T) => void,
    raw = false,
): (() => void) => {
    const key = `${endpoint}@${event}@${raw}`;

    const existingCleanupTimeout = SSECleanupTimeouts.get(key);
    if (existingCleanupTimeout !== undefined) {
        SSECleanupTimeouts.delete(key);
        clearTimeout(existingCleanupTimeout);
    }

    const existingSubscriber = SSESubscribers.get(key);
    if (existingSubscriber !== undefined) {
        return existingSubscriber();
    }

    const source = new ReconnectingEventSource(valetudoAPI.defaults.baseURL + endpoint, {
        withCredentials: true,
        max_retry_time: 30000
    });

    source.addEventListener(event, (event: any) => {
        listener(raw ? event.data : JSON.parse(event.data));
    });
    // eslint-disable-next-line no-console
    console.info(`[SSE] Subscribed to ${endpoint} ${event}`);

    let subscribers = 0;
    const subscriber = () => {
        subscribers += 1;

        return () => {
            subscribers -= 1;

            if (subscribers <= 0) {
                const existingCleanupTimeout = SSECleanupTimeouts.get(key);
                if (existingCleanupTimeout !== undefined) {
                    SSECleanupTimeouts.delete(key);
                    clearTimeout(existingCleanupTimeout);
                }

                SSECleanupTimeouts.set(
                    key,
                    setTimeout(() => {
                        // eslint-disable-next-line no-console
                        console.info(`[SSE] Unsubscribed from ${endpoint} ${event}`);

                        source.close();
                        SSESubscribers.delete(key);
                    }, 500)
                );
            }
        };
    };

    SSESubscribers.set(key, subscriber);

    return subscriber();
};

export const fetchCapabilities = (): Promise<Capability[]> => {
    return valetudoAPI
        .get<Capability[]>("/robot/capabilities")
        .then(({data}) => {
            return data;
        });
};

export const fetchMap = (): Promise<RawMapData> => {
    return valetudoAPI.get<RawMapData>("/robot/state/map").then(({data}) => {
        return preprocessMap(data);
    });
};

export const subscribeToMap = (
    listener: (data: RawMapData) => void
): (() => void) => {
    return subscribeToSSE(
        "/robot/state/map/sse",
        "MapUpdated",
        (data: RawMapData) => {
            listener(preprocessMap(data));
        });
};

export const fetchStateAttributes = async (): Promise<RobotAttribute[]> => {
    return valetudoAPI
        .get<RobotAttribute[]>("/robot/state/attributes")
        .then(({data}) => {
            return data;
        });
};

export const subscribeToStateAttributes = (
    listener: (data: RobotAttribute[]) => void
): (() => void) => {
    return subscribeToSSE<RobotAttribute[]>(
        "/robot/state/attributes/sse",
        "StateAttributesUpdated",
        (data) => {
            return listener(data);
        }
    );
};

export const fetchPresetSelections = async (
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl | Capability.OperationModeControl
): Promise<Array<PresetValue>> => {
    return valetudoAPI
        .get<PresetSelectionState["value"][]>(
            `/robot/capabilities/${capability}/presets`
        )
        .then(({data}) => {
            return data;
        });
};

export const updatePresetSelection = async (
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl | Capability.OperationModeControl,
    level: PresetSelectionState["value"]
): Promise<void> => {
    await valetudoAPI.put(`/robot/capabilities/${capability}/preset`, {
        name: level,
    });
};

export type BasicControlCommand = "start" | "stop" | "pause" | "home";
export const sendBasicControlCommand = async (
    command: BasicControlCommand
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.BasicControl}`,
        {
            action: command,
        }
    );
};

export const sendGoToCommand = async (point: Point): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.GoToLocation}`,
        {
            action: "goto",
            coordinates: floorObject(point),
        }
    );
};

export const fetchZoneProperties = async (): Promise<ZoneProperties> => {
    return valetudoAPI
        .get<ZoneProperties>(
            `/robot/capabilities/${Capability.ZoneCleaning}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const sendCleanZonesCommand = async (
    parameters: ZoneActionRequestParameters
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.ZoneCleaning}`,
        {
            action: "clean",
            zones: parameters.zones.map(floorObject),
            iterations: parameters.iterations
        }
    );
};

export const fetchSegments = async (): Promise<Segment[]> => {
    return valetudoAPI
        .get<Segment[]>(`/robot/capabilities/${Capability.MapSegmentation}`)
        .then(({data}) => {
            return data;
        });
};

export const fetchMapSegmentationProperties = async (): Promise<MapSegmentationProperties> => {
    return valetudoAPI
        .get<MapSegmentationProperties>(
            `/robot/capabilities/${Capability.MapSegmentation}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const sendCleanSegmentsCommand = async (
    parameters: MapSegmentationActionRequestParameters
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.MapSegmentation}`,
        {
            action: "start_segment_action",
            segment_ids: parameters.segment_ids,
            iterations: parameters.iterations ?? 1,
            customOrder: parameters.customOrder ?? false
        }
    );
};

export const sendJoinSegmentsCommand = async (
    parameters: MapSegmentEditJoinRequestParameters
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.MapSegmentEdit}`,
        {
            action: "join_segments",
            segment_a_id: parameters.segment_a_id,
            segment_b_id: parameters.segment_b_id
        }
    );
};

export const sendSplitSegmentCommand = async (
    parameters: MapSegmentEditSplitRequestParameters
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.MapSegmentEdit}`,
        {
            action: "split_segment",
            segment_id: parameters.segment_id,
            pA: parameters.pA,
            pB: parameters.pB
        }
    );
};

export const sendRenameSegmentCommand = async (
    parameters: MapSegmentRenameRequestParameters
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.MapSegmentRename}`,
        {
            action: "rename_segment",
            segment_id: parameters.segment_id,
            name: parameters.name
        }
    );
};

export const sendLocateCommand = async (): Promise<void> => {
    await valetudoAPI.put(`/robot/capabilities/${Capability.Locate}`, {
        action: "locate",
    });
};

export const sendAutoEmptyDockManualTriggerCommand = async (): Promise<void> => {
    await valetudoAPI.put(`/robot/capabilities/${Capability.AutoEmptyDockManualTrigger}`, {
        action: "trigger",
    });
};

export const fetchConsumableStateInformation = async (): Promise<Array<ConsumableState>> => {
    return valetudoAPI
        .get<Array<ConsumableState>>(`/robot/capabilities/${Capability.ConsumableMonitoring}`)
        .then(({data}) => {
            return data;
        });
};

export const sendConsumableReset = async (parameters: ConsumableId): Promise<void> => {
    let urlFragment = `${parameters.type}`;
    if (parameters.subType) {
        urlFragment += `/${parameters.subType}`;
    }
    return valetudoAPI
        .put(`/robot/capabilities/${Capability.ConsumableMonitoring}/${urlFragment}`, {
            action: "reset",
        })
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not reset consumable");
            }
        });
};

export const fetchConsumableProperties = async (): Promise<ConsumableProperties> => {
    return valetudoAPI
        .get<ConsumableProperties>(
            `/robot/capabilities/${Capability.ConsumableMonitoring}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const fetchRobotInformation = async (): Promise<RobotInformation> => {
    return valetudoAPI.get<RobotInformation>("/robot").then(({data}) => {
        return data;
    });
};

export const fetchValetudoInformation = async (): Promise<ValetudoInformation> => {
    return valetudoAPI.get<ValetudoInformation>("/valetudo").then(({data}) => {
        return data;
    });
};

export const sendDismissWelcomeDialogAction = async (): Promise<void> => {
    await valetudoAPI
        .put("/valetudo/action", {"action": "dismissWelcomeDialog"})
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not dismiss welcome dialog");
            }
        });
};

export const sendRestoreDefaultConfigurationAction = async (): Promise<void> => {
    await valetudoAPI
        .put("/valetudo/action", {"action": "restoreDefaultConfiguration"})
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not restore default configuration.");
            }
        });
};

export const fetchValetudoVersionInformation = async (): Promise<ValetudoVersion> => {
    return valetudoAPI
        .get<ValetudoVersion>("/valetudo/version")
        .then(({data}) => {
            return data;
        });
};

export const fetchValetudoLog = async (): Promise<string> => {
    return valetudoAPI
        .get<string>("/valetudo/log/content")
        .then(({ data }) => {
            return data;
        });
};

export const subscribeToLogMessages = (
    listener: (data: string) => void
): (() => void) => {
    return subscribeToSSE<string>(
        "/valetudo/log/content/sse",
        "LogMessage",
        (data) => {
            return listener(data);
        },
        true
    );
};

export const fetchValetudoLogLevel = async (): Promise<LogLevelResponse> => {
    return valetudoAPI
        .get<LogLevelResponse>("/valetudo/log/level")
        .then(({ data }) => {
            return data;
        });
};

export const sendValetudoLogLevel = async (logLevel: SetLogLevelRequest): Promise<void> => {
    await valetudoAPI
        .put("/valetudo/log/level", logLevel)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not set new log level");
            }
        });
};

export const fetchSystemHostInfo = async (): Promise<SystemHostInfo> => {
    return valetudoAPI
        .get<SystemHostInfo>("/system/host/info")
        .then(({data}) => {
            return data;
        });
};

export const fetchSystemRuntimeInfo = async (): Promise<SystemRuntimeInfo> => {
    return valetudoAPI
        .get<SystemRuntimeInfo>("/system/runtime/info")
        .then(({data}) => {
            return data;
        });
};

export const fetchMQTTConfiguration = async (): Promise<MQTTConfiguration> => {
    return valetudoAPI
        .get<MQTTConfiguration>("/valetudo/config/interfaces/mqtt")
        .then(({data}) => {
            return data;
        });
};

export const sendMQTTConfiguration = async (mqttConfiguration: MQTTConfiguration): Promise<void> => {
    return valetudoAPI
        .put("/valetudo/config/interfaces/mqtt", mqttConfiguration)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not update MQTT configuration");
            }
        });
};

export const fetchMQTTStatus = async (): Promise<MQTTStatus> => {
    return valetudoAPI
        .get<MQTTStatus>("/mqtt/status")
        .then(({data}) => {
            return data;
        });
};

export const fetchMQTTProperties = async (): Promise<MQTTProperties> => {
    return valetudoAPI
        .get<MQTTProperties>("/mqtt/properties")
        .then(({data}) => {
            return data;
        });
};

export const fetchHTTPBasicAuthConfiguration = async (): Promise<HTTPBasicAuthConfiguration> => {
    return valetudoAPI
        .get<HTTPBasicAuthConfiguration>("/valetudo/config/interfaces/http/auth/basic")
        .then(({data}) => {
            return data;
        });
};

export const sendHTTPBasicAuthConfiguration = async (configuration: HTTPBasicAuthConfiguration): Promise<void> => {
    return valetudoAPI
        .put("/valetudo/config/interfaces/http/auth/basic", configuration)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not update HTTP basic auth configuration");
            }
        });
};

export const fetchNetworkAdvertisementConfiguration = async (): Promise<NetworkAdvertisementConfiguration> => {
    return valetudoAPI
        .get<NetworkAdvertisementConfiguration>("/networkadvertisement/config")
        .then(({data}) => {
            return data;
        });
};

export const sendNetworkAdvertisementConfiguration = async (configuration: NetworkAdvertisementConfiguration): Promise<void> => {
    return valetudoAPI
        .put("/networkadvertisement/config", configuration)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not update NetworkAdvertisement configuration");
            }
        });
};

export const fetchNetworkAdvertisementProperties = async (): Promise<NetworkAdvertisementProperties> => {
    return valetudoAPI
        .get<NetworkAdvertisementProperties>("/networkadvertisement/properties")
        .then(({data}) => {
            return data;
        });
};

export const fetchNTPClientStatus = async (): Promise<NTPClientStatus> => {
    return valetudoAPI
        .get<NTPClientStatus>("/ntpclient/status")
        .then(({data}) => {
            return data;
        });
};

export const fetchNTPClientConfiguration = async (): Promise<NTPClientConfiguration> => {
    return valetudoAPI
        .get<NTPClientConfiguration>("/ntpclient/config")
        .then(({data}) => {
            return data;
        });
};

export const sendNTPClientConfiguration = async (configuration: NTPClientConfiguration): Promise<void> => {
    return valetudoAPI
        .put("/ntpclient/config", configuration)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not update NTP client configuration");
            }
        });
};

export const fetchTimerInformation = async (): Promise<TimerInformation> => {
    return valetudoAPI.get<TimerInformation>("/timers").then(({ data }) => {
        return data;
    });
};

export const deleteTimer = async (id: string): Promise<void> => {
    await valetudoAPI.delete(`/timers/${id}`);
};

export const sendTimerCreation = async (timerData: Timer): Promise<void> => {
    await valetudoAPI.post("/timers", timerData).then(({ status }) => {
        if (status !== 200) {
            throw new Error("Could not create timer");
        }
    });
};

export const sendTimerUpdate = async (timerData: Timer): Promise<void> => {
    await valetudoAPI
        .put(`/timers/${timerData.id}`, timerData)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not update timer");
            }
        });
};

export const sendTimerAction = async (timerId: string, timerAction: "execute_now"): Promise<void> => {
    await valetudoAPI
        .put(`/timers/${timerId}/action`, {action: timerAction})
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not send timer action");
            }
        });
};

export const fetchTimerProperties = async (): Promise<TimerProperties> => {
    return valetudoAPI
        .get<TimerProperties>("/timers/properties")
        .then(({ data }) => {
            return data;
        });
};

export const fetchValetudoEvents = async (): Promise<Array<ValetudoEvent>> => {
    return valetudoAPI
        .get<Array<ValetudoEvent>>("/events")
        .then(({ data }) => {
            return data;
        });
};

export const sendValetudoEventInteraction = async (interaction: ValetudoEventInteractionContext): Promise<void> => {
    await valetudoAPI
        .put(`/events/${interaction.id}/interact`, interaction.interaction)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not interact with event");
            }
        });
};

export const fetchPersistentMapState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.PersistentMapControl}`)
        .then(({ data }) => {
            return data;
        });
};

const sendToggleMutation = async (capability: Capability, enable: boolean): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${capability}`, {
            action: enable ? "enable" : "disable"
        })
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error(`Could not change ${capability} state`);
            }
        });
};

export const sendPersistentMapEnabled = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.PersistentMapControl, enable);
};

export const sendMapReset = async (): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.MapReset}`, {
            action: "reset"
        })
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not reset the map");
            }
        });
};

export const sendStartMappingPass = async (): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.MappingPass}`, {
            action: "start_mapping"
        })
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not start the mapping pass");
            }
        });
};

export const fetchSpeakerVolumeState = async (): Promise<SpeakerVolumeState> => {
    return valetudoAPI
        .get<SpeakerVolumeState>(`/robot/capabilities/${Capability.SpeakerVolumeControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendSpeakerVolume = async (volume: number): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.SpeakerVolumeControl}`, {
            action: "set_volume",
            value: volume,
        })
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not change speaker volume");
            }
        });
};

export const fetchVoicePackManagementState = async (): Promise<VoicePackManagementStatus> => {
    return valetudoAPI
        .get<VoicePackManagementStatus>(`/robot/capabilities/${Capability.VoicePackManagement}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendVoicePackManagementCommand = async (command: VoicePackManagementCommand): Promise<void> => {
    return valetudoAPI
        .put(`/robot/capabilities/${Capability.VoicePackManagement}`, command)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not send voice pack management command");
            }
        });
};

export const sendSpeakerTestCommand = async (): Promise<void> => {
    await valetudoAPI.put(`/robot/capabilities/${Capability.SpeakerTest}`, {
        action: "play_test_sound",
    });
};

export const fetchKeyLockState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.KeyLock}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendKeyLockEnable = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.KeyLock, enable);
};

export const fetchCarpetModeState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.CarpetModeControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendCarpetModeEnable = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.CarpetModeControl, enable);
};

export const fetchObstacleAvoidanceControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.ObstacleAvoidanceControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendObstacleAvoidanceControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.ObstacleAvoidanceControl, enable);
};

export const fetchPetObstacleAvoidanceControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.PetObstacleAvoidanceControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendPetObstacleAvoidanceControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.PetObstacleAvoidanceControl, enable);
};

export const fetchCollisionAvoidantNavigationControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.CollisionAvoidantNavigation}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendCollisionAvoidantNavigationControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.CollisionAvoidantNavigation, enable);
};


export const fetchDoNotDisturbConfiguration = async (): Promise<DoNotDisturbConfiguration> => {
    return valetudoAPI
        .get<DoNotDisturbConfiguration>(`/robot/capabilities/${Capability.DoNotDisturb}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendDoNotDisturbConfiguration = async (configuration: DoNotDisturbConfiguration): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.DoNotDisturb}`, configuration)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not update DND configuration");
            }
        });
};

export const fetchWifiStatus = async (): Promise<WifiStatus> => {
    return valetudoAPI
        .get<WifiStatus>(`/robot/capabilities/${Capability.WifiConfiguration}`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchWifiConfigurationProperties = async (): Promise<WifiConfigurationProperties> => {
    return valetudoAPI
        .get<WifiConfigurationProperties>(`/robot/capabilities/${Capability.WifiConfiguration}/properties`)
        .then(({ data }) => {
            return data;
        });
};


export const sendWifiConfiguration = async (configuration: WifiConfiguration): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.WifiConfiguration}`, configuration)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not set Wifi configuration");
            }
        });
};

export const fetchWifiScan = async (): Promise<Array<ValetudoWifiNetwork>> => {
    return valetudoAPI
        .get<Array<ValetudoWifiNetwork>>(`/robot/capabilities/${Capability.WifiScan}`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchManualControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.ManualControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchManualControlProperties = async (): Promise<ManualControlProperties> => {
    return valetudoAPI
        .get<ManualControlProperties>(`/robot/capabilities/${Capability.ManualControl}/properties`)
        .then(({ data }) => {
            return data;
        });
};

export const sendManualControlInteraction = async (interaction: ManualControlInteraction): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.ManualControl}`, interaction)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not send manual control interaction");
            }
        });
};

export const fetchHighResolutionManualControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.HighResolutionManualControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendHighResolutionManualControlInteraction = async (interaction: HighResolutionManualControlInteraction): Promise<void> => {
    await valetudoAPI
        .put(`/robot/capabilities/${Capability.HighResolutionManualControl}`, interaction)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not send high resolution manual control interaction");
            }
        });
};

export const fetchCombinedVirtualRestrictionsProperties = async (): Promise<CombinedVirtualRestrictionsProperties> => {
    return valetudoAPI
        .get<CombinedVirtualRestrictionsProperties>(
            `/robot/capabilities/${Capability.CombinedVirtualRestrictions}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const sendCombinedVirtualRestrictionsUpdate = async (
    parameters: CombinedVirtualRestrictionsUpdateRequestParameters
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.CombinedVirtualRestrictions}`,
        parameters
    );
};

export const fetchUpdaterConfiguration = async (): Promise<UpdaterConfiguration> => {
    return valetudoAPI
        .get<UpdaterConfiguration>("/updater/config")
        .then(({data}) => {
            return data;
        });
};

export const sendUpdaterConfiguration = async (configuration: UpdaterConfiguration): Promise<void> => {
    return valetudoAPI
        .put("/updater/config", configuration)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not update updater configuration");
            }
        });
};

export const fetchUpdaterState = async (): Promise<UpdaterState> => {
    return valetudoAPI
        .get<UpdaterState>("/updater/state")
        .then(({data}) => {
            return data;
        });
};

export const sendUpdaterCommand = async (
    command: "check" | "download" | "apply"
): Promise<void> => {
    await valetudoAPI.put(
        "/updater",
        {
            "action": command
        }
    );
};

export const fetchCurrentStatistics = async (): Promise<Array<ValetudoDataPoint>> => {
    return valetudoAPI
        .get<Array<ValetudoDataPoint>>(`/robot/capabilities/${Capability.CurrentStatistics}`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchCurrentStatisticsProperties = async (): Promise<StatisticsProperties> => {
    return valetudoAPI
        .get<StatisticsProperties>(`/robot/capabilities/${Capability.CurrentStatistics}/properties`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchTotalStatistics = async (): Promise<Array<ValetudoDataPoint>> => {
    return valetudoAPI
        .get<Array<ValetudoDataPoint>>(`/robot/capabilities/${Capability.TotalStatistics}`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchTotalStatisticsProperties = async (): Promise<StatisticsProperties> => {
    return valetudoAPI
        .get<StatisticsProperties>(`/robot/capabilities/${Capability.TotalStatistics}/properties`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchQuirks = async (): Promise<Array<Quirk>> => {
    return valetudoAPI
        .get<Array<Quirk>>(`/robot/capabilities/${Capability.Quirks}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendSetQuirkValueCommand = async (command: SetQuirkValueCommand): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.Quirks}`,
        {
            "id": command.id,
            "value": command.value
        }
    );
};

export const fetchRobotProperties = async (): Promise<RobotProperties> => {
    return valetudoAPI
        .get<RobotProperties>("/robot/properties")
        .then(({ data }) => {
            return data;
        });
};

export type MopDockCleanManualTriggerCommand = "start" | "stop";
export const sendMopDockCleanManualTriggerCommand = async (
    command: MopDockCleanManualTriggerCommand
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.MopDockCleanManualTrigger}`,
        {
            action: command,
        }
    );
};

export type MopDockDryManualTriggerCommand = "start" | "stop";
export const sendMopDockDryManualTriggerCommand = async (
    command: MopDockDryManualTriggerCommand
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.MopDockDryManualTrigger}`,
        {
            action: command,
        }
    );
};

export const fetchMopExtensionControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.MopExtensionControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendMopExtensionControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.MopExtensionControl, enable);
};

export const fetchCameraLightControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.CameraLightControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendCameraLightControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.CameraLightControl, enable);
};

export const fetchMopTwistControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.MopTwistControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendMopTwistControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.MopTwistControl, enable);
};

export const fetchMopExtensionFurnitureLegHandlingControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.MopExtensionFurnitureLegHandlingControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendMopExtensionFurnitureLegHandlingControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.MopExtensionFurnitureLegHandlingControl, enable);
};

export const fetchValetudoCustomizations = async (): Promise<ValetudoCustomizations> => {
    return valetudoAPI
        .get<ValetudoCustomizations>("/valetudo/config/customizations")
        .then(({data}) => {
            return data;
        });
};

export const sendValetudoCustomizations = async (customizations: ValetudoCustomizations): Promise<void> => {
    return valetudoAPI
        .put("/valetudo/config/customizations", customizations)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not update ValetudoCustomizations");
            }
        });
};


export const sendCarpetSensorMode = async (payload: CarpetSensorModePayload): Promise<void> => {
    return valetudoAPI
        .put(`/robot/capabilities/${Capability.CarpetSensorModeControl}`, payload)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not send carpet sensor mode");
            }
        });
};

export const fetchCarpetSensorMode = async (): Promise<CarpetSensorMode> => {
    return valetudoAPI
        .get<CarpetSensorModePayload>(`/robot/capabilities/${Capability.CarpetSensorModeControl}`)
        .then(({data}) => {
            return data.mode;
        });
};

export const fetchCarpetSensorModeProperties = async (): Promise<CarpetSensorModeControlProperties> => {
    return valetudoAPI
        .get<CarpetSensorModeControlProperties>(
            `/robot/capabilities/${Capability.CarpetSensorModeControl}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const sendAutoEmptyDockAutoEmptyInterval = async (payload: AutoEmptyDockAutoEmptyIntervalPayload): Promise<void> => {
    return valetudoAPI
        .put(`/robot/capabilities/${Capability.AutoEmptyDockAutoEmptyIntervalControl}`, payload)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not send auto empty dock auto empty interval");
            }
        });
};

export const fetchAutoEmptyDockAutoEmptyInterval = async (): Promise<AutoEmptyDockAutoEmptyInterval> => {
    return valetudoAPI
        .get<AutoEmptyDockAutoEmptyIntervalPayload>(`/robot/capabilities/${Capability.AutoEmptyDockAutoEmptyIntervalControl}`)
        .then(({data}) => {
            return data.interval;
        });
};

export const fetchAutoEmptyDockAutoEmptyIntervalProperties = async (): Promise<AutoEmptyDockAutoEmptyIntervalProperties> => {
    return valetudoAPI
        .get<AutoEmptyDockAutoEmptyIntervalProperties>(
            `/robot/capabilities/${Capability.AutoEmptyDockAutoEmptyIntervalControl}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const fetchObstacleImagesState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.ObstacleImages}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendObstacleImagesState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.ObstacleImages, enable);
};

export const fetchObstacleImagesProperties = async (): Promise<ObstacleImagesProperties> => {
    return valetudoAPI
        .get<ObstacleImagesProperties>(`/robot/capabilities/${Capability.ObstacleImages}/properties`)
        .then(({ data }) => {
            return data;
        });
};

export const sendMopDockMopWashTemperature = async (payload: MopDockMopWashTemperaturePayload): Promise<void> => {
    return valetudoAPI
        .put(`/robot/capabilities/${Capability.MopDockMopWashTemperatureControl}`, payload)
        .then(({status}) => {
            if (status !== 200) {
                throw new Error("Could not send mop dock mop wash temperature");
            }
        });
};

export const fetchMopDockMopWashTemperature = async (): Promise<MopDockMopWashTemperature> => {
    return valetudoAPI
        .get<MopDockMopWashTemperaturePayload>(`/robot/capabilities/${Capability.MopDockMopWashTemperatureControl}`)
        .then(({data}) => {
            return data.temperature;
        });
};

export const fetchMopDockMopWashTemperatureProperties = async (): Promise<MopDockMopWashTemperatureProperties> => {
    return valetudoAPI
        .get<MopDockMopWashTemperatureProperties>(
            `/robot/capabilities/${Capability.MopDockMopWashTemperatureControl}/properties`
        )
        .then(({data}) => {
            return data;
        });
};

export const fetchMopDockMopAutoDryingControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.MopDockMopAutoDryingControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendMopDockMopAutoDryingControlState = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.MopDockMopAutoDryingControl, enable);
};
