import axios from "axios";
import { RawMapData } from "./RawMapData";
import { PresetSelectionState, RobotAttribute } from "./RawRobotState";
import {
    Capability,
    GitHubRelease,
    GoToLocation,
    MapSegmentationActionRequestParameters,
    MapSegmentationProperties,
    Point,
    RobotInformation,
    Segment,
    SystemHostInfo,
    Timer,
    TimerInformation,
    TimerProperties,
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
    listener: (data: T) => void
): (() => void) => {
    const key = `${endpoint}@${event}`;
    const tracker = SSETracker.get(key);
    if (tracker !== undefined) {
        return tracker();
    }

    const source = new EventSource(valetudoAPI.defaults.baseURL + endpoint, {
        withCredentials: true,
    });

    source.addEventListener(event, (event: any) => {
        const data = JSON.parse(event.data);
        listener(data);
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

export const fetchSystemHostInfo = async (): Promise<SystemHostInfo> => {
    return valetudoAPI
        .get<SystemHostInfo>("/system/host/info")
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
