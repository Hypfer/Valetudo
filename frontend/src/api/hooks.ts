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
    fetchCombinedVirtualRestrictionsPropertiesProperties,
    fetchConsumableStateInformation,
    fetchCurrentStatistics,
    fetchCurrentStatisticsProperties,
    fetchDoNotDisturbConfiguration,
    fetchHTTPBasicAuthConfiguration,
    fetchKeyLockState,
    fetchManualControlProperties,
    fetchManualControlState,
    fetchMap,
    fetchMapSegmentationProperties,
    fetchMQTTConfiguration,
    fetchMQTTProperties,
    fetchNTPClientConfiguration,
    fetchNTPClientState,
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
    fetchTotalStatistics,
    fetchTotalStatisticsProperties,
    fetchUpdaterState,
    fetchValetudoEvents,
    fetchValetudoVersionInformation,
    fetchValetudoLog,
    fetchValetudoLogLevel,
    fetchVoicePackManagementState,
    fetchWifiStatus,
    fetchZoneProperties,
    sendAutoEmptyDockAutoEmptyControlEnable,
    sendAutoEmptyDockManualTriggerCommand,
    sendBasicControlCommand,
    sendCarpetModeEnable,
    sendCleanSegmentsCommand,
    sendCleanTemporaryZonesCommand,
    sendCombinedVirtualRestrictionsUpdate,
    sendConsumableReset,
    sendDoNotDisturbConfiguration,
    sendGoToCommand,
    sendHTTPBasicAuthConfiguration,
    sendJoinSegmentsCommand,
    sendKeyLockEnable,
    sendLocateCommand,
    sendManualControlInteraction,
    sendMapReset,
    sendMQTTConfiguration,
    sendNTPClientConfiguration,
    sendPersistentDataEnable,
    sendRenameSegmentCommand,
    sendSpeakerTestCommand,
    sendSpeakerVolume,
    sendSplitSegmentCommand,
    sendStartMappingPass,
    sendTimerCreation,
    sendTimerUpdate,
    sendUpdaterCommand,
    sendValetudoEventInteraction,
    sendValetudoLogLevel,
    sendVoicePackManagementCommand,
    sendWifiConfiguration,
    subscribeToLogMessages,
    subscribeToMap,
    subscribeToStateAttributes,
    updatePresetSelection,
    fetchValetudoInformation,
    fetchQuirks,
    sendSetQuirkValueCommand,
    fetchRobotProperties,
    fetchMQTTStatus,
    fetchNetworkAdvertisementConfiguration,
    fetchNetworkAdvertisementProperties,
    sendNetworkAdvertisementConfiguration,
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
    CombinedVirtualRestrictionsUpdateRequestParameters,
    ConsumableId,
    DoNotDisturbConfiguration,
    HTTPBasicAuthConfiguration,
    ManualControlInteraction,
    MapSegmentationActionRequestParameters,
    MapSegmentEditJoinRequestParameters,
    MapSegmentEditSplitRequestParameters,
    MapSegmentRenameRequestParameters,
    MQTTConfiguration,
    NetworkAdvertisementConfiguration,
    NTPClientConfiguration,
    NTPClientState,
    Point,
    SetLogLevelRequest,
    Timer,
    ValetudoEventInteractionContext,
    VoicePackManagementCommand,
    WifiConfiguration,
    Zone,
} from "./types";
import {MutationFunction} from "react-query/types/core/types";

enum CacheKey {
    Capabilities = "capabilities",
    Map = "map",
    Consumables = "consumables",
    Attributes = "attributes",
    PresetSelections = "preset_selections",
    ZoneProperties = "zone_properties",
    Segments = "segments",
    MapSegmentationProperties = "map_segmentation_properties",
    PersistentData = "persistent_data",
    RobotInformation = "robot_information",
    ValetudoInformation = "valetudo_information",
    ValetudoVersion = "valetudo_version",
    CarpetMode = "carpet_mode",
    SpeakerVolume = "speaker_volume",
    VoicePackManagement = "voice_pack",
    SystemHostInfo = "system_host_info",
    SystemRuntimeInfo = "system_runtime_info",
    MQTTConfiguration = "mqtt_configuration",
    MQTTStatus = "mqtt_status",
    MQTTProperties = "mqtt_properties",
    HTTPBasicAuth = "http_basic_auth",
    NetworkAdvertisementConfiguration = "network_advertisement_configuration",
    NetworkAdvertisementProperties = "network_advertisement_properties",
    NTPClientState = "ntp_client_state",
    NTPClientConfiguration = "ntp_client_configuration",
    Timers = "timers",
    TimerProperties = "timer_properties",
    ValetudoEvents = "valetudo_events",
    Log = "log",
    LogLevel = "log_level",
    KeyLockInformation = "key_lock",
    AutoEmptyDockAutoEmpty = "auto_empty_dock_auto_empty",
    DoNotDisturb = "do_not_disturb",
    WifiStatus = "wifi_status",
    ManualControl = "manual_control",
    ManualControlProperties = "manual_control_properties",
    CombinedVirtualRestrictionsProperties = "combined_virtual_restrictions_properties",
    UpdaterState = "updater_state",
    CurrentStatistics = "current_statistics",
    CurrentStatisticsProperties = "current_statistics_properties",
    TotalStatistics = "total_statistics",
    TotalStatisticsProperties = "total_statistics_properties",
    Quirks = "quirks",
    RobotProperties = "robot_properties"
}

const useOnCommandError = (capability: Capability | string): ((error: unknown) => void) => {
    const {enqueueSnackbar} = useSnackbar();

    return React.useCallback((error: any) => {
        let errorMessage = "";
        if (typeof error?.toString === "function") {
            errorMessage = error.toString();
        }

        if (typeof error?.response?.data === "string") {
            errorMessage = error.response.data;
        }

        enqueueSnackbar(`An error occurred while sending command to ${capability}:\n${errorMessage}`, {
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

export const useZonePropertiesQuery = () => {
    return useQuery(CacheKey.ZoneProperties, fetchZoneProperties, {
        staleTime: Infinity,
    });
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

// As conditional hooks aren't allowed, this query needs a way to be disabled but referenced
// for cases where a component might need the properties but only if the capability exists
export const useMapSegmentationPropertiesQuery = (enabled?: boolean) => {
    return useQuery(CacheKey.MapSegmentationProperties, fetchMapSegmentationProperties, {
        staleTime: Infinity,
        enabled: enabled ?? true
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

export const useJoinSegmentsMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, MapSegmentEditJoinRequestParameters>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.MapSegmentEdit);

    return useMutation(
        (parameters: MapSegmentEditJoinRequestParameters) => {
            return sendJoinSegmentsCommand(parameters).then(fetchStateAttributes); //TODO: this should actually refetch the map
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

export const useSplitSegmentMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, MapSegmentEditSplitRequestParameters>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.MapSegmentEdit);

    return useMutation(
        (parameters: MapSegmentEditSplitRequestParameters) => {
            return sendSplitSegmentCommand(parameters).then(fetchStateAttributes); //TODO: this should actually refetch the map
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

export const useRenameSegmentMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, MapSegmentRenameRequestParameters>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.MapSegmentRename);

    return useMutation(
        (parameters: MapSegmentRenameRequestParameters) => {
            return sendRenameSegmentCommand(parameters).then(fetchStateAttributes); //TODO: this should actually refetch the map
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

export const useValetudoInformationQuery = () => {
    return useQuery(CacheKey.ValetudoInformation, fetchValetudoInformation, {
        staleTime: Infinity,
    });
};

export const useValetudoVersionQuery = () => {
    return useQuery(CacheKey.ValetudoVersion, fetchValetudoVersionInformation, {
        staleTime: Infinity,
    });
};

export const useSystemHostInfoQuery = () => {
    return useQuery(CacheKey.SystemHostInfo, fetchSystemHostInfo);
};

export const useSystemRuntimeInfoQuery = () => {
    return useQuery(CacheKey.SystemRuntimeInfo, fetchSystemRuntimeInfo);
};

export const useMQTTConfigurationQuery = () => {
    return useQuery(CacheKey.MQTTConfiguration, fetchMQTTConfiguration, {
        staleTime: Infinity,
    });
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

export const useMQTTStatusQuery = () => {
    return useQuery(CacheKey.MQTTStatus, fetchMQTTStatus, {
        staleTime: 5_000,
        refetchInterval: 5_000
    });
};

export const useMQTTPropertiesQuery = () => {
    return useQuery(CacheKey.MQTTProperties, fetchMQTTProperties, {
        staleTime: Infinity,
    });
};

export const useHTTPBasicAuthConfigurationQuery = () => {
    return useQuery(CacheKey.HTTPBasicAuth, fetchHTTPBasicAuthConfiguration, {
        staleTime: Infinity,
    });
};

export const useHTTPBasicAuthConfigurationMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("HTTP Basic Auth"),
        CacheKey.HTTPBasicAuth,
        (configuration: HTTPBasicAuthConfiguration) => {
            return sendHTTPBasicAuthConfiguration(configuration).then(fetchHTTPBasicAuthConfiguration);
        }
    );
};

export const useNetworkAdvertisementConfigurationQuery = () => {
    return useQuery(CacheKey.NetworkAdvertisementConfiguration, fetchNetworkAdvertisementConfiguration, {
        staleTime: Infinity,
    });
};

export const useNetworkAdvertisementConfigurationMutation = () => {
    return useValetudoFetchingMutation(
        useOnSettingsChangeError("Network Advertisement"),
        CacheKey.NetworkAdvertisementConfiguration,
        (networkAdvertisementConfiguration: NetworkAdvertisementConfiguration) => {
            return sendNetworkAdvertisementConfiguration(networkAdvertisementConfiguration).then(fetchNetworkAdvertisementConfiguration);
        }
    );
};

export const useNetworkAdvertisementPropertiesQuery = () => {
    return useQuery(CacheKey.NetworkAdvertisementProperties, fetchNetworkAdvertisementProperties, {
        staleTime: Infinity,
    });
};

export const useNTPClientStateQuery = () => {
    return useQuery(CacheKey.NTPClientState, fetchNTPClientState, {
        staleTime: 5_000,
        refetchInterval: 5_000
    });
};

export const useNTPClientConfigurationQuery = () => {
    return useQuery(CacheKey.NTPClientConfiguration, fetchNTPClientConfiguration, {
        staleTime: Infinity,
    });
};

export const useNTPClientConfigurationMutation = () => {
    const queryClient = useQueryClient();
    const onError = useOnSettingsChangeError("NTP Client");

    return useMutation(
        (configuration: NTPClientConfiguration) => {
            return sendNTPClientConfiguration(configuration).then(fetchNTPClientConfiguration).then((configuration) => {
                queryClient.setQueryData<NTPClientConfiguration>(CacheKey.NTPClientConfiguration, configuration, {
                    updatedAt: Date.now(),
                });
            }).then(fetchNTPClientState).then((state) => {
                queryClient.setQueryData<NTPClientState>(CacheKey.NTPClientState, state, {
                    updatedAt: Date.now(),
                });
            });
        },
        {
            onError
        }
    );
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
        (logLevel: SetLogLevelRequest) => {
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

export const useAutoEmptyDockAutoEmptyControlQuery = () => {
    return useQuery(CacheKey.AutoEmptyDockAutoEmpty, fetchAutoEmptyDockAutoEmptyControlState, {
        staleTime: Infinity
    });
};

export const useAutoEmptyDockAutoEmptyControlMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.AutoEmptyDockAutoEmptyControl),
        CacheKey.AutoEmptyDockAutoEmpty,
        (enable: boolean) => {
            return sendAutoEmptyDockAutoEmptyControlEnable(enable).then(fetchAutoEmptyDockAutoEmptyControlState);
        }
    );
};

export const useDoNotDisturbConfigurationQuery = () => {
    return useQuery(CacheKey.DoNotDisturb, fetchDoNotDisturbConfiguration, {
        staleTime: Infinity
    });
};

export const useDoNotDisturbConfigurationMutation = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.DoNotDisturb),
        CacheKey.DoNotDisturb,
        (configuration: DoNotDisturbConfiguration) => {
            return sendDoNotDisturbConfiguration(configuration).then(fetchDoNotDisturbConfiguration);
        }
    );
};

export const useWifiStatusQuery = () => {
    return useQuery(CacheKey.WifiStatus, fetchWifiStatus, {
        staleTime: Infinity
    });
};

export const useWifiConfigurationMutation = (
    options?: UseMutationOptions<void, unknown, WifiConfiguration>
) => {
    const {
        refetch: refetchWifiStatus,
    } = useWifiStatusQuery();

    return useMutation(
        sendWifiConfiguration,
        {
            onError: useOnCommandError(Capability.WifiConfiguration),
            async onSuccess(data, ...args) {
                refetchWifiStatus().catch(() => {
                    /*intentional*/
                });

                await options?.onSuccess?.(data, ...args);
            }
        }
    );
};

export const useManualControlStateQuery = () => {
    return useQuery(CacheKey.ManualControl, fetchManualControlState, {
        staleTime: 10_000,
        refetchInterval: 10_000
    });
};

export const useManualControlPropertiesQuery = () => {
    return useQuery(CacheKey.ManualControlProperties, fetchManualControlProperties, {
        staleTime: Infinity
    });
};

export const useManualControlInteraction = () => {
    return useValetudoFetchingMutation(
        useOnCommandError(Capability.ManualControl),
        CacheKey.ManualControl,
        (interaction: ManualControlInteraction) => {
            return sendManualControlInteraction(interaction).then(fetchManualControlState);
        }
    );
};

export const useCombinedVirtualRestrictionsPropertiesQuery = () => {
    return useQuery(CacheKey.CombinedVirtualRestrictionsProperties, fetchCombinedVirtualRestrictionsPropertiesProperties, {
        staleTime: Infinity
    });
};

export const useCombinedVirtualRestrictionsMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, CombinedVirtualRestrictionsUpdateRequestParameters>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.CombinedVirtualRestrictions);

    return useMutation(
        (parameters: CombinedVirtualRestrictionsUpdateRequestParameters) => {
            return sendCombinedVirtualRestrictionsUpdate(parameters).then(fetchStateAttributes); //TODO: this should actually refetch the map
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

export const useUpdaterStateQuery = () => {
    return useQuery(CacheKey.UpdaterState, fetchUpdaterState, {
        staleTime: 5_000,
        refetchInterval: 5_000
    });
};

export const useUpdaterCommandMutation = () => {
    const {
        refetch: refetchUpdaterState,
    } = useUpdaterStateQuery();

    return useMutation(
        sendUpdaterCommand,
        {
            onError: useOnCommandError("Updater"),
            onSuccess() {
                refetchUpdaterState().catch(() => {/*intentional*/});
            }
        }
    );
};

export const useCurrentStatisticsQuery = () => {
    return useQuery(CacheKey.CurrentStatistics, fetchCurrentStatistics , {
        staleTime: 60_000,
        refetchInterval: 60_000
    });
};

export const useCurrentStatisticsPropertiesQuery = () => {
    return useQuery(CacheKey.CurrentStatisticsProperties, fetchCurrentStatisticsProperties, {
        staleTime: Infinity
    });
};

export const useTotalStatisticsQuery = () => {
    return useQuery(CacheKey.TotalStatistics, fetchTotalStatistics , {
        staleTime: 60_000,
        refetchInterval: 60_000
    });
};

export const useTotalStatisticsPropertiesQuery = () => {
    return useQuery(CacheKey.TotalStatisticsProperties, fetchTotalStatisticsProperties, {
        staleTime: Infinity
    });
};

export const useQuirksQuery = () => {
    return useQuery(CacheKey.Quirks, fetchQuirks);
};

export const useSetQuirkValueMutation = () => {
    const {
        refetch: refetchQuirksState,
    } = useQuirksQuery();

    return useMutation(
        sendSetQuirkValueCommand,
        {
            onError: useOnCommandError(Capability.Quirks),
            onSuccess() {
                refetchQuirksState().catch(() => {/*intentional*/});
            }
        }
    );
};

export const useRobotPropertiesQuery = () => {
    return useQuery(CacheKey.RobotProperties, fetchRobotProperties, {
        staleTime: Infinity,
    });
};
