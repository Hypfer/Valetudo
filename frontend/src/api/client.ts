import axios from "axios";
import { RawMapData } from "./RawMapData";
import { PresetSelectionState, RobotAttribute } from "./RawRobotState";
import {
    Capability,
    CombinedVirtualRestrictionsProperties,
    CombinedVirtualRestrictionsUpdateRequestParameters,
    ConsumableId,
    ConsumableState,
    DoNotDisturbConfiguration,
    GitHubRelease,
    GoToLocation,
    HTTPBasicAuthConfiguration,
    LogLevelResponse,
    ManualControlInteraction,
    ManualControlProperties,
    MapSegmentationActionRequestParameters,
    MapSegmentationProperties,
    MapSegmentEditJoinRequestParameters,
    MapSegmentEditSplitRequestParameters,
    MapSegmentRenameRequestParameters,
    MQTTConfiguration,
    MQTTProperties,
    NTPClientConfiguration,
    NTPClientState,
    Point,
    RobotInformation,
    Segment,
    SetLogLevelRequest,
    SimpleToggleState,
    SpeakerVolumeState,
    StatisticsProperties,
    SystemHostInfo,
    SystemRuntimeInfo,
    Timer,
    TimerInformation,
    TimerProperties,
    UpdaterState,
    ValetudoDataPoint,
    ValetudoEvent,
    ValetudoEventInteractionContext,
    ValetudoInformation,
    ValetudoVersion,
    VoicePackManagementCommand,
    VoicePackManagementStatus,
    WifiConfiguration,
    Zone,
    ZonePreset,
    ZoneProperties,
} from "./types";
import { floorObject } from "./utils";

export const valetudoAPI = axios.create({
    baseURL: "../api/v2",
});

const SSETracker = new Map<string, () => () => void>();

const subscribeToSSE = <T>(
    endpoint: string,
    event: string,
    listener: (data: T) => void,
    raw = false,
): (() => void) => {
    const key = `${endpoint}@${event}@${raw}`;
    const tracker = SSETracker.get(key);
    if (tracker !== undefined) {
        return tracker();
    }

    const source = new EventSource(valetudoAPI.defaults.baseURL + endpoint, {
        withCredentials: true,
    });

    source.addEventListener(event, (event: any) => {
        listener(raw ? event.data : JSON.parse(event.data));
    });
    // eslint-disable-next-line no-console
    console.log(`[SSE] Subscribed to ${endpoint} ${event}`);

    let subscribers = 0;
    const subscriber = () => {
        subscribers += 1;

        return () => {
            subscribers -= 1;

            if (subscribers <= 0) {
                source.close();
                SSETracker.delete(key);
            }
        };
    };

    SSETracker.set(key, subscriber);

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
        return data;
    });
};

export const subscribeToMap = (
    listener: (data: RawMapData) => void
): (() => void) => {
    return subscribeToSSE("/robot/state/map/sse", "MapUpdated", listener);
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
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl
): Promise<PresetSelectionState["value"][]> => {
    return valetudoAPI
        .get<PresetSelectionState["value"][]>(
            `/robot/capabilities/${capability}/presets`
        )
        .then(({data}) => {
            return data;
        });
};

export const updatePresetSelection = async (
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl,
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

export const fetchZonePresets = async (): Promise<ZonePreset[]> => {
    return valetudoAPI
        .get<Record<string, ZonePreset>>(
            `/robot/capabilities/${Capability.ZoneCleaning}/presets`
        )
        .then(({data}) => {
            return Object.values(data);
        });
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

export const sendCleanZonePresetCommand = async (id: string): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.ZoneCleaning}/presets/${id}`,
        {
            action: "clean",
        }
    );
};

export const sendCleanTemporaryZonesCommand = async (
    zones: Zone[]
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.ZoneCleaning}`,
        {
            action: "clean",
            zones: zones.map(floorObject),
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

export const fetchGoToLocationPresets = async (): Promise<Segment[]> => {
    return valetudoAPI
        .get<Record<string, GoToLocation>>(
            `/robot/capabilities/${Capability.GoToLocation}/presets`
        )
        .then(({data}) => {
            return Object.values(data);
        });
};

export const sendGoToLocationPresetCommand = async (
    id: string
): Promise<void> => {
    await valetudoAPI.put(
        `/robot/capabilities/${Capability.GoToLocation}/presets/${id}`,
        {
            action: "goto",
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
            if (status !== 202) {
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

export const fetchLatestGitHubRelease = async (): Promise<GitHubRelease> => {
    return axios
        .get<GitHubRelease[]>(
            "https://api.github.com/repos/Hypfer/Valetudo/releases"
        )
        .then(({data}) => {
            const release = data.find((release) => {
                return !release.draft && !release.prerelease;
            });
            if (release === undefined) {
                throw new Error("No releases found");
            }

            return release;
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
            if (status !== 202) {
                throw new Error("Could not update MQTT configuration");
            }
        });
};

export const fetchMQTTProperties = async (): Promise<MQTTProperties> => {
    return valetudoAPI
        .get<MQTTProperties>("/valetudo/config/interfaces/mqtt/properties")
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
            if (status !== 201) {
                throw new Error("Could not update HTTP basic auth configuration");
            }
        });
};

export const fetchNTPClientState = async (): Promise<NTPClientState> => {
    return valetudoAPI
        .get<NTPClientState>("/ntpclient/state")
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
            if (status !== 202) {
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
        if (status !== 201) {
            throw new Error("Could not create timer");
        }
    });
};

export const sendTimerUpdate = async (timerData: Timer): Promise<void> => {
    await valetudoAPI
        .post(`/timers/${timerData.id}`, timerData)
        .then(({ status }) => {
            if (status !== 200) {
                throw new Error("Could not update timer");
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

export const fetchPersistentDataState = async (): Promise<SimpleToggleState> => {
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

export const sendPersistentDataEnable = async (enable: boolean): Promise<void> => {
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

export const fetchObstacleAvoidanceModeState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.ObstacleAvoidanceControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendObstacleAvoidanceModeEnable = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.ObstacleAvoidanceControl, enable);
};

export const fetchAutoEmptyDockAutoEmptyControlState = async (): Promise<SimpleToggleState> => {
    return valetudoAPI
        .get<SimpleToggleState>(`/robot/capabilities/${Capability.AutoEmptyDockAutoEmptyControl}`)
        .then(({ data }) => {
            return data;
        });
};

export const sendAutoEmptyDockAutoEmptyControlEnable = async (enable: boolean): Promise<void> => {
    await sendToggleMutation(Capability.AutoEmptyDockAutoEmptyControl, enable);
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

export const fetchWifiConfiguration = async (): Promise<WifiConfiguration> => {
    return valetudoAPI
        .get<WifiConfiguration>(`/robot/capabilities/${Capability.WifiConfiguration}`)
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

export const fetchCombinedVirtualRestrictionsPropertiesProperties = async (): Promise<CombinedVirtualRestrictionsProperties> => {
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
        .get<Array<ValetudoDataPoint>>(`/robot/capabilities/${Capability.CurrentStatisticsCapability}`)
        .then(({ data }) => {
            return data;
        });
};

export const fetchCurrentStatisticsProperties = async (): Promise<StatisticsProperties> => {
    return valetudoAPI
        .get<StatisticsProperties>(`/robot/capabilities/${Capability.CurrentStatisticsCapability}/properties`)
        .then(({ data }) => {
            return data;
        });
};




