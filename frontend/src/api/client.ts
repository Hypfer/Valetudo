import axios from "axios";
import { RawMapData } from "./RawMapData";
import { PresetSelectionState, RobotAttribute } from "./RawRobotState";
import {
    Capability,
    ConsumableId,
    ConsumableState,
    GitHubRelease,
    GoToLocation,
    LogLevel,
    MapSegmentationActionRequestParameters,
    MapSegmentationProperties,
    MQTTConfiguration,
    MQTTProperties,
    Point,
    RobotInformation,
    Segment,
    SetLogLevel,
    SystemHostInfo,
    SystemRuntimeInfo,
    Timer,
    TimerInformation,
    TimerProperties,
    ValetudoEvent,
    ValetudoEventInteractionContext,
    ValetudoVersion,
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
    await valetudoAPI.put<void>(`/robot/capabilities/${capability}/preset`, {
        name: level,
    });
};

export type BasicControlCommand = "start" | "stop" | "pause" | "home";
export const sendBasicControlCommand = async (
    command: BasicControlCommand
): Promise<void> => {
    await valetudoAPI.put<void>(
        `/robot/capabilities/${Capability.BasicControl}`,
        {
            action: command,
        }
    );
};

export const sendGoToCommand = async (point: Point): Promise<void> => {
    await valetudoAPI.put<void>(
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
    await valetudoAPI.put<void>(
        `/robot/capabilities/${Capability.ZoneCleaning}/presets/${id}`,
        {
            action: "clean",
        }
    );
};

export const sendCleanTemporaryZonesCommand = async (
    zones: Zone[]
): Promise<void> => {
    await valetudoAPI.put<void>(
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
    await valetudoAPI.put<void>(
        `/robot/capabilities/${Capability.MapSegmentation}`,
        {
            action: "start_segment_action",
            segment_ids: parameters.segment_ids,
            iterations: parameters.iterations ?? 1,
            customOrder: parameters.customOrder ?? false
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
    await valetudoAPI.put<void>(
        `/robot/capabilities/${Capability.GoToLocation}/presets/${id}`,
        {
            action: "goto",
        }
    );
};

export const sendLocateCommand = async (): Promise<void> => {
    await valetudoAPI.put<void>(`/robot/capabilities/${Capability.Locate}`, {
        action: "locate",
    });
};

export const sendAutoEmptyDockManualTriggerCommand = async (): Promise<void> => {
    await valetudoAPI.put<void>(`/robot/capabilities/${Capability.AutoEmptyDockManualTrigger}`, {
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
        .put<MQTTConfiguration>(`/robot/capabilities/${Capability.ConsumableMonitoring}/${urlFragment}`, {
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

export const fetchValetudoInformation = async (): Promise<ValetudoVersion> => {
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

export const fetchValetudoLogLevel = async (): Promise<LogLevel> => {
    return valetudoAPI
        .get<LogLevel>("/valetudo/log/level")
        .then(({ data }) => {
            return data;
        });
};

export const sendValetudoLogLevel = async (logLevel: SetLogLevel): Promise<void> => {
    await valetudoAPI
        .put<void>("/valetudo/log/level", logLevel)
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
        .put<MQTTConfiguration>("/valetudo/config/interfaces/mqtt", mqttConfiguration)
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
