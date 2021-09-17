export enum Capability {
    AutoEmptyDockManualTrigger = "AutoEmptyDockManualTriggerCapability",
    BasicControl = "BasicControlCapability",
    CarpetModeControl = "CarpetModeControlCapability",
    CombinedVirtualRestrictions = "CombinedVirtualRestrictionsCapability",
    ConsumableMonitoring = "ConsumableMonitoringCapability",
    Debug = "DebugCapability",
    DoNotDisturb = "DoNotDisturbCapability",
    FanSpeedControl = "FanSpeedControlCapability",
    GoToLocation = "GoToLocationCapability",
    LEDControl = "LEDControlCapability",
    Locate = "LocateCapability",
    ManualControl = "ManualControlCapability",
    MapReset = "MapResetCapability",
    MapSegmentEdit = "MapSegmentEditCapability",
    MapSegmentRename = "MapSegmentRenameCapability",
    MapSegmentation = "MapSegmentationCapability",
    MapSnapshot = "MapSnapshotCapability",
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
