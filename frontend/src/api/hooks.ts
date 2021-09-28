/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useSnackbar } from "notistack";
import React from "react";
import {
    useMutation,
    UseMutationOptions,
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "react-query";
import {
    BasicControlCommand,
    deleteTimer,
    fetchAutoEmptyDockAutoEmptyControlState,
    fetchCapabilities,
    fetchCarpetModeState,
    fetchConsumableStateInformation,
    fetchGoToLocationPresets,
    fetchKeyLockState,
    fetchLatestGitHubRelease,
    fetchMap,
    fetchMapSegmentationProperties,
    fetchMQTTConfiguration,
    fetchMQTTProperties,
    fetchObstacleAvoidanceModeState,
    fetchPersistentDataState,
    fetchPresetSelections,
    fetchRobotInformation,
    fetchSegments,
    fetchSpeakerVolumeState,
    fetchStateAttributes,
    fetchSystemHostInfo,
    fetchSystemRuntimeInfo,
    fetchTimerInformation,
    fetchTimerProperties,
    fetchValetudoEvents,
    fetchValetudoInformation,
    fetchValetudoLog,
    fetchValetudoLogLevel,
    fetchVoicePackManagementState,
    fetchZonePresets,
    fetchZoneProperties,
    sendAutoEmptyDockAutoEmptyControlEnable,
    sendAutoEmptyDockManualTriggerCommand,
    sendBasicControlCommand,
    sendCarpetModeEnable,
    sendCleanSegmentsCommand,
    sendCleanTemporaryZonesCommand,
    sendCleanZonePresetCommand,
    sendConsumableReset,
    sendGoToCommand,
    sendGoToLocationPresetCommand,
    sendKeyLockEnable,
    sendLocateCommand,
    sendMapReset,
    sendMQTTConfiguration,
    sendObstacleAvoidanceModeEnable,
    sendPersistentDataEnable,
    sendSpeakerTestCommand,
    sendSpeakerVolume,
    sendStartMappingPass,
    sendTimerCreation,
    sendTimerUpdate,
    sendValetudoEventInteraction,
    sendValetudoLogLevel,
    sendVoicePackManagementCommand,
    subscribeToLogMessages,
    subscribeToMap,
    subscribeToStateAttributes,
    updatePresetSelection,
} from "./client";
import {
    PresetSelectionState,
    RobotAttribute,
    RobotAttributeClass,
    StatusState,
} from "./RawRobotState";
import { isAttribute } from "./utils";
import {
    Capability,
    ConsumableId,
    MapSegmentationActionRequestParameters,
    MQTTConfiguration,
    Point,
    SetLogLevel,
    Timer,
    ValetudoEventInteractionContext, VoicePackManagementCommand,
    Zone,
} from "./types";
import {MutationFunction} from "react-query/types/core/types";

enum CacheKey {
    Capabilities = "capabilities",
    Map = "map",
    Consumables = "consumables",
    Attributes = "attributes",
    PresetSelections = "preset_selections",
    ZonePresets = "zone_presets",
    ZoneProperties = "zone_properties",
    Segments = "segments",
    MapSegmentationProperties = "map_segmentation_properties",
    GoToLocationPresets = "go_to_location_presets",
    PersistentData = "persistent_data",
    RobotInformation = "robot_information",
    ValetudoVersion = "valetudo_version",
    GitHubRelease = "github_release",
    CarpetMode = "carpet_mode",
    SpeakerVolume = "speaker_volume",
    VoicePackManagement = "voice_pack",
    SystemHostInfo = "system_host_info",
    SystemRuntimeInfo = "system_runtime_info",
    MQTTConfiguration = "mqtt_configuration",
    MQTTProperties = "mqtt_properties",
    Timers = "timers",
    TimerProperties = "timer_properties",
    ValetudoEvents = "valetudo_events",
    Log = "log",
    LogLevel = "log_level",
    KeyLockInformation = "key_lock",
    ObstacleAvoidance = "obstacle_avoidance",
    AutoEmptyDockAutoEmpty = "auto_empty_dock_auto_empty",
}

const useOnCommandError = (capability: Capability): ((error: unknown) => void) => {
    const {enqueueSnackbar} = useSnackbar();

    return React.useCallback((error: unknown) => {
        enqueueSnackbar(`An error occurred while sending command to ${capability}: ${error}`, {
            preventDuplicate: true,
            key: capability,
            variant: "error",
        });
    }, [capability, enqueueSnackbar]);
};

const useOnSettingsChangeError = (setting: string): ((error: unknown) => void) => {
    const {enqueueSnackbar} = useSnackbar();

    return React.useCallback((error: unknown) => {
        enqueueSnackbar(`An error occurred while updating ${setting} settings: ${error}`, {
            preventDuplicate: true,
            key: setting,
            variant: "error",
        });
    }, [setting, enqueueSnackbar]);
};

const useSSECacheUpdater = <T>(
    key: CacheKey,
    subscriber: (listener: (data: T) => void) => () => void
): void => {
    const queryClient = useQueryClient();

    React.useEffect(() => {
        return subscriber((data) => {
            return queryClient.setQueryData(key, data);
        });
    }, [key, queryClient, subscriber]);
};

const useSSECacheAppender = <T>(
    key: CacheKey,
    subscriber: (listener: (data: T) => void) => () => void,
): void => {
    const queryClient = useQueryClient();

    React.useEffect(() => {
        return subscriber((data) => {
            let currentLog = queryClient.getQueryData(key);
            let newData;
            if (typeof currentLog === "string" || currentLog instanceof String) {
                currentLog = currentLog.trim();
                newData = `${currentLog}\n${data}`;
            } else {
                newData = `${data}`;
            }
            return queryClient.setQueryData(key, newData);
        });
    }, [key, queryClient, subscriber]);
};

export const useCapabilitiesQuery = () => {
    return useQuery(CacheKey.Capabilities, fetchCapabilities, {
        staleTime: Infinity,
    });
};

export const useRobotMapQuery = () => {
    useSSECacheUpdater(CacheKey.Map, subscribeToMap);
    return useQuery(CacheKey.Map, fetchMap, {
        staleTime: 1000,
    });
};

export function useRobotAttributeQuery<C extends RobotAttributeClass>(
    clazz: C
): UseQueryResult<Extract<RobotAttribute, { __class: C }>[]>;
export function useRobotAttributeQuery<C extends RobotAttributeClass, T>(
    clazz: C,
    select: (attributes: Extract<RobotAttribute, { __class: C }>[]) => T
): UseQueryResult<T>;
export function useRobotAttributeQuery<C extends RobotAttributeClass>(
    clazz: C,
    select?: (attributes: Extract<RobotAttribute, { __class: C }>[]) => any
): UseQueryResult<any> {
    useSSECacheUpdater(CacheKey.Attributes, subscribeToStateAttributes);
    return useQuery(CacheKey.Attributes, fetchStateAttributes, {
        staleTime: 1000,
        select: (attributes) => {
            const filteredAttributes = attributes.filter(isAttribute(clazz));

            return select ? select(filteredAttributes) : filteredAttributes;
        },
    });
}

export function useRobotStatusQuery(): UseQueryResult<StatusState>;
export function useRobotStatusQuery<T>(
    select: (status: StatusState) => T
): UseQueryResult<T>;
export function useRobotStatusQuery(select?: (status: StatusState) => any) {
    useSSECacheUpdater(CacheKey.Attributes, subscribeToStateAttributes);
    return useQuery(CacheKey.Attributes, fetchStateAttributes, {
        staleTime: 1000,
        select: (attributes) => {
            const status =
                attributes.filter(isAttribute(RobotAttributeClass.StatusState))[0] ??
                ({
                    __class: RobotAttributeClass.StatusState,
                    metaData: {},
                    value: "error",
                    flag: "none",
                } as StatusState);

            return select ? select(status) : status;
        },
    });
}

export const usePresetSelectionsQuery = (
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl
) => {
    return useQuery(
        [CacheKey.PresetSelections, capability],
        () => {
            return fetchPresetSelections(capability);
        },
        {
            staleTime: Infinity,
        }
    );
};

export const capabilityToPresetType: Record<Parameters<typeof usePresetSelectionMutation>[0],
    PresetSelectionState["type"]> = {
        [Capability.FanSpeedControl]: "fan_speed",
        [Capability.WaterUsageControl]: "water_grade",
    };
export const usePresetSelectionMutation = (
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(capability);

    return useMutation(
        (level: PresetSelectionState["value"]) => {
            return updatePresetSelection(capability, level).then(
                fetchStateAttributes
            );
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
            },
            onError,
        }
    );
};

export const useBasicControlMutation = () => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.BasicControl);

    return useMutation(
        (command: BasicControlCommand) => {
            return sendBasicControlCommand(command).then(fetchStateAttributes);
        },
        {
            onError,
            onSuccess(data) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
            },
        }
    );
};

export const useGoToMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, Point>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.GoToLocation);

    return useMutation(
        (coordinates: { x: number; y: number }) => {
            return sendGoToCommand(coordinates).then(fetchStateAttributes);
        },
        {
            onError,
            ...options,
            async onSuccess(data, ...args) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
                await options?.onSuccess?.(data, ...args);
            },
        }
    );
};

export const useZonePresetsQuery = () => {
    return useQuery(CacheKey.ZonePresets, fetchZonePresets);
};

export const useZonePropertiesQuery = () => {
    return useQuery(CacheKey.ZoneProperties, fetchZoneProperties, {
        staleTime: Infinity,
    });
};

export const useCleanZonePresetMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, string>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.ZoneCleaning);

    return useMutation(
        (id: string) => {
            return sendCleanZonePresetCommand(id).then(fetchStateAttributes);
        },
        {
            onError,
            ...options,
            async onSuccess(data, ...args) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
                await options?.onSuccess?.(data, ...args);
            },
        }
    );
};

export const useCleanTemporaryZonesMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, Zone[]>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.ZoneCleaning);

    return useMutation(
        (zones: Zone[]) => {
            return sendCleanTemporaryZonesCommand(zones).then(fetchStateAttributes);
        },
        {
            onError,
            ...options,
            async onSuccess(data, ...args) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
                await options?.onSuccess?.(data, ...args);
            },
        }
    );
};

export const useSegmentsQuery = () => {
    return useQuery(CacheKey.Segments, fetchSegments);
};

export const useMapSegmentationPropertiesQuery = () => {
    return useQuery(CacheKey.MapSegmentationProperties, fetchMapSegmentationProperties, {
        staleTime: Infinity
    });
};

export const useCleanSegmentsMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, MapSegmentationActionRequestParameters>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.MapSegmentation);

    return useMutation(
        (parameters: MapSegmentationActionRequestParameters) => {
            return sendCleanSegmentsCommand(parameters).then(fetchStateAttributes);
        },
        {
            onError,
            ...options,
            async onSuccess(data, ...args) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
                await options?.onSuccess?.(data, ...args);
            },
        }
    );
};

export const useGoToLocationPresetsQuery = () => {
    return useQuery(CacheKey.GoToLocationPresets, fetchGoToLocationPresets);
};

export const useGoToLocationPresetMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, string>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.ZoneCleaning);

    return useMutation(
        (id: string) => {
            return sendGoToLocationPresetCommand(id).then(fetchStateAttributes);
        },
        {
            onError,
            ...options,
            async onSuccess(data, ...args) {
                queryClient.setQueryData<RobotAttribute[]>(CacheKey.Attributes, data, {
                    updatedAt: Date.now(),
                });
                await options?.onSuccess?.(data, ...args);
            },
        }
    );
};

export const useLocateMutation = () => {
    const onError = useOnCommandError(Capability.Locate);

    return useMutation(sendLocateCommand, {onError});
};

export const useConsumableStateQuery = () => {
    return useQuery(CacheKey.Consumables, fetchConsumableStateInformation);
};

const useValetudoFetchingMutation = <TData, TVariables>(onError: ((error: unknown) => void), cacheKey: CacheKey, mutationFn: MutationFunction<TData, TVariables>) => {
    const queryClient = useQueryClient();

    return useMutation(
        mutationFn,
        {
            onSuccess(data) {
                queryClient.setQueryData<TData>(cacheKey, data, {
                    updatedAt: Date.now(),
                });
            },
            onError
        }
    );
};

export const useConsumableResetMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.ConsumableMonitoring),
        CacheKey.Consumables,
        (parameters: ConsumableId) => {
            return sendConsumableReset(parameters).then(fetchConsumableStateInformation);
        }
    );
};

export const useAutoEmptyDockManualTriggerMutation = () => {
    const onError = useOnCommandError(Capability.AutoEmptyDockManualTrigger);

    return useMutation(sendAutoEmptyDockManualTriggerCommand, {onError});
};

export const useRobotInformationQuery = () => {
    return useQuery(CacheKey.RobotInformation, fetchRobotInformation, {
        staleTime: Infinity,
    });
};

export const useValetudoVersionQuery = () => {
    return useQuery(CacheKey.ValetudoVersion, fetchValetudoInformation, {
        staleTime: Infinity,
    });
};

export const useLatestGitHubReleaseLazyQuery = () => {
    return useQuery(CacheKey.GitHubRelease, fetchLatestGitHubRelease, {
        enabled: false,
    });
};

export const useSystemHostInfoQuery = () => {
    return useQuery(CacheKey.SystemHostInfo, fetchSystemHostInfo);
};

export const useSystemRuntimeInfoQuery = () => {
    return useQuery(CacheKey.SystemRuntimeInfo, fetchSystemRuntimeInfo);
};

export const useMQTTConfigurationQuery = () => {
    return useQuery(CacheKey.MQTTConfiguration, fetchMQTTConfiguration);
};

export const useMQTTConfigurationMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("MQTT"),
        CacheKey.MQTTConfiguration,
        (mqttConfiguration: MQTTConfiguration) => {
            return sendMQTTConfiguration(mqttConfiguration).then(fetchMQTTConfiguration);
        }
    );
};

export const useMQTTPropertiesQuery = () => {
    return useQuery(CacheKey.MQTTProperties, fetchMQTTProperties, {
        staleTime: Infinity,
    });
};

export const useTimerInfoQuery = () => {
    return useQuery(CacheKey.Timers, fetchTimerInformation);
};

export const useTimerPropertiesQuery = () => {
    return useQuery(CacheKey.TimerProperties, fetchTimerProperties, {
        staleTime: Infinity
    });
};

export const useTimerCreationMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("Timer"),
        CacheKey.Timers,
        (timer: Timer) => {
            return sendTimerCreation(timer).then(fetchTimerInformation);
        }
    );
};

export const useTimerModificationMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("Timer"),
        CacheKey.Timers,
        (timer: Timer) => {
            return sendTimerUpdate(timer).then(fetchTimerInformation);
        }
    );
};

export const useTimerDeletionMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("Timer"),
        CacheKey.Timers,
        (timerId: string) => {
            return deleteTimer(timerId).then(fetchTimerInformation);
        }
    );
};

export const useValetudoEventsQuery = () => {
    return useQuery(CacheKey.ValetudoEvents, fetchValetudoEvents, {
        staleTime: 30_000,
        refetchInterval: 30_000
    });
};

export const useValetudoEventsInteraction = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("Valetudo Events"),
        CacheKey.ValetudoEvents,
        (interaction: ValetudoEventInteractionContext) => {
            return sendValetudoEventInteraction(interaction).then(fetchValetudoEvents);
        }
    );
};

export function useValetudoLogQuery(): UseQueryResult<string>;
export function useValetudoLogQuery<T>(
    select: (status: StatusState) => T
): UseQueryResult<T>;
export function useValetudoLogQuery() {
    useSSECacheAppender(CacheKey.Log, subscribeToLogMessages);
    return useQuery(CacheKey.Log, fetchValetudoLog, {
        staleTime: Infinity,
    });
}

export const useLogLevelQuery = () => {
    return useQuery(CacheKey.LogLevel, fetchValetudoLogLevel, {
        staleTime: Infinity
    });
};

export const useLogLevelMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("Log level"),
        CacheKey.LogLevel,
        (logLevel: SetLogLevel) => {
            return sendValetudoLogLevel(logLevel).then(fetchValetudoLogLevel);
        }
    );
};

export const usePersistentDataQuery = () => {
    return useQuery(CacheKey.PersistentData, fetchPersistentDataState, {
        staleTime: Infinity
    });
};

export const usePersistentDataMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.PersistentMapControl),
        CacheKey.PersistentData,
        (enable: boolean) => {
            return sendPersistentDataEnable(enable).then(fetchPersistentDataState);
        }
    );
};

export const useMapResetMutation = () => {
    const onError = useOnCommandError(Capability.MapReset);

    return useMutation(
        sendMapReset,
        {
            onError,
        }
    );
};

export const useStartMappingPassMutation = () => {
    const onError = useOnCommandError(Capability.MappingPass);

    return useMutation(
        sendStartMappingPass,
        {
            onError,
        }
    );
};

export const useSpeakerVolumeStateQuery = () => {
    return useQuery(CacheKey.SpeakerVolume, fetchSpeakerVolumeState, {
        staleTime: Infinity
    });
};

export const useSpeakerVolumeMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.SpeakerVolumeControl),
        CacheKey.SpeakerVolume,
        (volume: number) => {
            return sendSpeakerVolume(volume).then(fetchSpeakerVolumeState);
        }
    );
};

export const useSpeakerTestTriggerTriggerMutation = () => {
    const onError = useOnCommandError(Capability.SpeakerTest);

    return useMutation(sendSpeakerTestCommand, {onError});
};

export const useVoicePackManagementStateQuery = () => {
    return useQuery(CacheKey.VoicePackManagement, fetchVoicePackManagementState, {
        staleTime: 500,
    });
};

export const useVoicePackManagementMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.VoicePackManagement),
        CacheKey.VoicePackManagement,
        (command: VoicePackManagementCommand) => {
            return sendVoicePackManagementCommand(command).then(fetchVoicePackManagementState);
        }
    );
};

export const useKeyLockStateQuery = () => {
    return useQuery(CacheKey.KeyLockInformation, fetchKeyLockState, {
        staleTime: Infinity
    });
};

export const useKeyLockStateMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.KeyLock),
        CacheKey.KeyLockInformation,
        (enable: boolean) => {
            return sendKeyLockEnable(enable).then(fetchKeyLockState);
        }
    );
};

export const useCarpetModeStateQuery = () => {
    return useQuery(CacheKey.CarpetMode, fetchCarpetModeState, {
        staleTime: Infinity
    });
};

export const useCarpetModeStateMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.CarpetModeControl),
        CacheKey.CarpetMode,
        (enable: boolean) => {
            return sendCarpetModeEnable(enable).then(fetchCarpetModeState);
        }
    );
};

export const useObstacleAvoidanceModeStateQuery = () => {
    return useQuery(CacheKey.ObstacleAvoidance, fetchObstacleAvoidanceModeState, {
        staleTime: Infinity
    });
};

export const useObstacleAvoidanceModeStateMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.ObstacleAvoidanceControl),
        CacheKey.ObstacleAvoidance,
        (enable: boolean) => {
            return sendObstacleAvoidanceModeEnable(enable).then(fetchObstacleAvoidanceModeState);
        }
    );
};

export const useAutoEmptyDockAutoEmptyControlQuery = () => {
    return useQuery(CacheKey.AutoEmptyDockAutoEmpty, fetchAutoEmptyDockAutoEmptyControlState, {
        staleTime: Infinity
    });
};

export const useAutoEmptyDockAutoEmptyControlMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.ObstacleAvoidanceControl),
        CacheKey.AutoEmptyDockAutoEmpty,
        (enable: boolean) => {
            return sendAutoEmptyDockAutoEmptyControlEnable(enable).then(fetchAutoEmptyDockAutoEmptyControlState);
        }
    );
};

