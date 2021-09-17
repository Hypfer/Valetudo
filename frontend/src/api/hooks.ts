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
    fetchCapabilities,
    fetchGoToLocationPresets,
    fetchLatestGitHubRelease,
    fetchMap,
    fetchMapSegmentationProperties,
    fetchMQTTConfiguration,
    fetchMQTTProperties,
    fetchPresetSelections,
    fetchRobotInformation,
    fetchSegments,
    fetchStateAttributes,
    fetchSystemHostInfo,
    fetchSystemRuntimeInfo,
    fetchTimerInformation,
    fetchTimerProperties,
    fetchValetudoEvents,
    fetchValetudoInformation,
    fetchZonePresets,
    fetchZoneProperties,
    sendAutoEmptyDockManualTriggerCommand,
    sendBasicControlCommand,
    sendCleanSegmentsCommand,
    sendCleanTemporaryZonesCommand,
    sendCleanZonePresetCommand,
    sendGoToCommand,
    sendGoToLocationPresetCommand,
    sendLocateCommand,
    sendMQTTConfiguration,
    sendTimerCreation,
    sendTimerUpdate,
    sendValetudoEventInteraction,
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
    Point,
    MapSegmentationActionRequestParameters,
    Zone,
    Timer,
    TimerInformation,
    MQTTConfiguration,
    ValetudoEventInteractionContext,
    ValetudoEvent
} from "./types";

enum CacheKey {
    Capabilities = "capabilities",
    Map = "map",
    Attributes = "attributes",
    PresetSelections = "preset_selections",
    ZonePresets = "zone_presets",
    ZoneProperties = "zone_properties",
    Segments = "segments",
    MapSegmentationProperties = "map_segmentation_properties",
    GoToLocationPresets = "go_to_location_presets",
    RobotInformation = "robot_information",
    ValetudoVersion = "valetudo_version",
    GitHubRelease = "github_release",
    SystemHostInfo = "system_host_info",
    SystemRuntimeInfo = "system_runtime_info",
    MQTTConfiguration = "mqtt_configuration",
    MQTTProperties = "mqtt_properties",
    Timers = "timers",
    TimerProperties = "timer_properties",
    ValetudoEvents = "valetudo_events",
}

const useOnCommandError = (capability: Capability): ((error: unknown) => void) => {
    const { enqueueSnackbar } = useSnackbar();

    return React.useCallback((error: unknown) => {
        enqueueSnackbar(`An error occurred while sending command to ${capability}: ${error}`, {
            preventDuplicate: true,
            key: capability,
        });
    }, [capability, enqueueSnackbar]);
};

const useOnSettingsChangeError = (setting: string): ((error: unknown) => void) => {
    const { enqueueSnackbar } = useSnackbar();

    return React.useCallback((error: unknown) => {
        enqueueSnackbar(`An error occurred while updating ${setting} settings: ${error}`, {
            preventDuplicate: true,
            key: setting,
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

export const capabilityToPresetType: Record<
    Parameters<typeof usePresetSelectionMutation>[0],
    PresetSelectionState["type"]
    > = {
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
        (parameters : MapSegmentationActionRequestParameters) => {
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

    return useMutation(sendLocateCommand, { onError });
};

export const useAutoEmptyDockManualTriggerMutation = () => {
    const onError = useOnCommandError(Capability.AutoEmptyDockManualTrigger);

    return useMutation(sendAutoEmptyDockManualTriggerCommand, { onError });
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
    const queryClient = useQueryClient();
    const onError = useOnSettingsChangeError("MQTT");

    return useMutation(
        (mqttConfiguration: MQTTConfiguration) => {
            return sendMQTTConfiguration(mqttConfiguration).then(fetchMQTTConfiguration);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<MQTTConfiguration>(CacheKey.MQTTConfiguration, data, {
                    updatedAt: Date.now(),
                });
            },
            onError,
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
    const queryClient = useQueryClient();
    const onError = useOnSettingsChangeError("Timer");

    return useMutation(
        (timer: Timer) => {
            return sendTimerCreation(timer).then(fetchTimerInformation);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<TimerInformation>(CacheKey.Timers, data, {
                    updatedAt: Date.now(),
                });
            },
            onError,
        }
    );
};

export const useTimerModificationMutation = () => {
    const queryClient = useQueryClient();
    const onError = useOnSettingsChangeError("Timer");

    return useMutation(
        (timer: Timer) => {
            return sendTimerUpdate(timer).then(fetchTimerInformation);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<TimerInformation>(CacheKey.Timers, data, {
                    updatedAt: Date.now(),
                });
            },
            onError,
        }
    );
};

export const useTimerDeletionMutation = () => {
    const queryClient = useQueryClient();
    const onError = useOnSettingsChangeError("Timer");

    return useMutation(
        (timerId: string) => {
            return deleteTimer(timerId).then(fetchTimerInformation);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<TimerInformation>(CacheKey.Timers, data, {
                    updatedAt: Date.now(),
                });
            },
            onError,
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
    const queryClient = useQueryClient();
    const onError = useOnSettingsChangeError("Valetudo Events");

    return useMutation(
        (interaction: ValetudoEventInteractionContext) => {
            return sendValetudoEventInteraction(interaction).then(fetchValetudoEvents);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<Array<ValetudoEvent>>(CacheKey.ValetudoEvents, data, {
                    updatedAt: Date.now(),
                });
            },
            onError,
        }
    );
};
