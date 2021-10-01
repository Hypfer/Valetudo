export enum Capability {
    AutoEmptyDockAutoEmptyControl = "AutoEmptyDockAutoEmptyControlCapability",
    AutoEmptyDockManualTrigger = "AutoEmptyDockManualTriggerCapability",
    BasicControl = "BasicControlCapability",
    CarpetModeControl = "CarpetModeControlCapability",
    CombinedVirtualRestrictions = "CombinedVirtualRestrictionsCapability",
    ConsumableMonitoring = "ConsumableMonitoringCapability",
    Debug = "DebugCapability",
    DoNotDisturb = "DoNotDisturbCapability",
    FanSpeedControl = "FanSpeedControlCapability",
    GoToLocation = "GoToLocationCapability",
    KeyLock = "KeyLockCapability",
    LEDControl = "LEDControlCapability",
    Locate = "LocateCapability",
    ManualControl = "ManualControlCapability",
    MapReset = "MapResetCapability",
    MapSegmentEdit = "MapSegmentEditCapability",
    MapSegmentRename = "MapSegmentRenameCapability",
    MapSegmentation = "MapSegmentationCapability",
    MapSnapshot = "MapSnapshotCapability",
    MappingPass = "MappingPassCapability",
    ObstacleAvoidanceControl = "ObstacleAvoidanceControlCapability",
    PersistentMapControl = "PersistentMapControlCapability",
    SensorCalibration = "SensorCalibrationCapability",
    SpeakerTest = "SpeakerTestCapability",
    SpeakerVolumeControl = "SpeakerVolumeControlCapability",
    VoicePackManagement = "VoicePackManagementCapability",
    WaterUsageControl = "WaterUsageControlCapability",
    WifiConfiguration = "WifiConfigurationCapability",
    ZoneCleaning = "ZoneCleaningCapability",
}

export type Point = {
    x: number;
    y: number;
};

export interface Zone {
    points: {
        pA: Point;
        pB: Point;
        pC: Point;
        pD: Point;
    };
    iterations: number;
}

export interface ZonePreset {
    id: string;
    name: string;
    zones: Zone[];
}

export interface ZoneProperties {
    zoneCount: {
        min: number;
        max: number;
    };
    iterationCount: {
        min: number;
        max: number;
    };
}

export interface MapSegmentationProperties {
    iterationCount: {
        min: number;
        max: number;
    };
    customOrderSupport: boolean;
}

export interface GoToLocation {
    id: string;
    name: string;
    coordinates: {
        x: number;
        y: number;
    };
}

export interface Segment {
    id: string;
    name?: string;
}

export interface RobotInformation {
    manufacturer: string;
    modelName: string;
    implementation: string;
}

export interface ValetudoVersion {
    release: string;
    commit: string;
}

export interface GitHubRelease {
    id: number;
    tag_name: string;
    draft: boolean;
    prerelease: boolean;
    published_at: string;
    html_url: string;
    assets: Array<{
        name: string;
        id: number;
        browser_download_url: string;
    }>;
}

export interface SystemHostInfo {
    hostname: string;
    arch: string;
    mem: {
        total: number;
        free: number;
        valetudo_current: number;
        valetudo_max: number;
    };
    uptime: number;
    load: {
        1: number;
        5: number;
        15: number;
    };
}

export interface SystemRuntimeInfo {
    uptime: number;
    argv: Array<string>;
    execArgv: Array<string>;
    execPath: string;
    uid: number;
    gid: number;
    pid: number;
    versions: Record<string, string>;
    env: Record<string, string>
}

export interface MapSegmentationActionRequestParameters {
    segment_ids: string[];
    iterations?: number;
    customOrder?: boolean;
}

export interface ConsumableState {
    type: string;
    subType?: string;
    remaining: {
        value: number;
        unit: "percent" | "minutes";
    }
}

export interface ConsumableId {
    type: string;
    subType?: string;
}

export interface Timer {
    id: string;
    enabled: boolean;
    dow: Array<number>;
    hour: number;
    minute: number;
    action: {
        type: string;
        params: Record<string, unknown>;
    };
}

export interface TimerInformation {
    [id: string]: Timer;
}

export interface TimerProperties {
    supportedActions: Array<string>;
}

export interface MQTTConfiguration {
    enabled: boolean;
    connection: {
        host: string;
        port: number;
        tls: {
            enabled: boolean;
            ca: string;
        };
        authentication: {
            credentials: {
                enabled: boolean;
                username: string;
                password: string;
            };
            clientCertificate: {
                enabled: boolean;
                certificate: string;
                key: string;
            };
        };
    };
    identity: {
        friendlyName: string;
        identifier: string;
    };
    customizations: {
        topicPrefix: string;
        provideMapData: boolean;
    };
    interfaces: {
        homie: {
            enabled: boolean;
            addICBINVMapProperty: boolean;
            cleanAttributesOnShutdown: boolean;
        };
        homeassistant: {
            enabled: boolean;
            cleanAutoconfOnShutdown: boolean;
        };
    };
}

export interface MQTTProperties {
    defaults: {
        identity: {
            friendlyName: string;
            identifier: string;
        };
        customizations: {
            topicPrefix: string;
        };
    };
}

export interface ValetudoEvent {
    __class: string;
    id: string;
    timestamp: string;
    processed: boolean;
    type?: string;
    subType?: string;
    message?: string;
}

export interface ValetudoEventInteraction {
    interaction: "ok" | "yes" | "no" | "reset";
}

// Helper for Hook
export interface ValetudoEventInteractionContext {
    id: string;
    interaction: ValetudoEventInteraction;
}

export interface LogLevel {
    current: string;
    presets: Array<string>;
}

export interface SetLogLevel {
    level: string;
}

export interface SimpleToggleState {
    enabled: boolean;
}

export interface SpeakerVolumeState {
    volume: number;
}

export interface VoicePackManagementStatus {
    currentLanguage: string;
    operationStatus: {
        type: "idle" | "downloading" | "installing" | "error";
        progress?: number;
    }
}

export interface VoicePackManagementCommand {
    action: "download";
    url: string;
    language: string;
    hash: string;
}

export interface DoNotDisturbTime {
    hour: number;
    minute: number;
}

export interface DoNotDisturbConfiguration {
    enabled: boolean;
    start: DoNotDisturbTime;
    end: DoNotDisturbTime;
}

export interface WifiConfiguration {
    ssid?: string;
    credentials?: {
        type: "wpa2_psk";
        typeSpecificSettings: {
            password: string;
        };
    }
    details?: {
        state: "connected" | "not_connected" | "unknown";
        downspeed?: number;
        upspeed?: number;
        signal?: number;
        ips: string[];
        frequency: "2.4ghz" | "5ghz";
    };
}
