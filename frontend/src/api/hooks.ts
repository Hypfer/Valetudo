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
    fetchCapabilities,
    fetchGoToLocationPresets,
    fetchLatestGitHubRelease,
    fetchMap,
    fetchPresetSelections,
    fetchRobotInformation,
    fetchSegments,
    fetchStateAttributes,
    fetchSystemHostInfo,
    fetchValetudoInformation,
    fetchZonePresets,
    fetchZoneProperties,
    sendBasicControlCommand,
    sendCleanSegmentsCommand,
    sendCleanTemporaryZonesCommand,
    sendCleanZonePresetCommand,
    sendGoToCommand,
    sendGoToLocationPresetCommand,
    sendLocateCommand,
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
import { Capability, Point, Zone } from "./types";

enum CacheKey {
    Capabilities = "capabilities",
    Map = "map",
    Attributes = "attributes",
    PresetSelections = "preset_selections",
    ZonePresets = "zone_presets",
    ZoneProperties = "zone_properties",
    Segments = "segments",
    GoToLocationPresets = "go_to_location_presets",
    RobotInformation = "robot_information",
    ValetudoVersion = "valetudo_version",
    GitHubRelease = "github_release",
    SystemHostInfo = "system_host_info",
}

const useOnCommandError = (capability: Capability): (() => void) => {
    const { enqueueSnackbar } = useSnackbar();

    return React.useCallback(() => {
        enqueueSnackbar(`An error occured while sending command to ${capability}`, {
            preventDuplicate: true,
            key: capability,
        });
    }, [capability, enqueueSnackbar]);
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
    return useQuery(CacheKey.ZonePresets, fetchZonePresets, {
        staleTime: Infinity,
    });
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
    return useQuery(CacheKey.Segments, fetchSegments, { staleTime: Infinity });
};

export const useCleanSegmentsMutation = (
    options?: UseMutationOptions<RobotAttribute[], unknown, string[]>
) => {
    const queryClient = useQueryClient();
    const onError = useOnCommandError(Capability.ZoneCleaning);

    return useMutation(
        (ids: string[]) => {
            return sendCleanSegmentsCommand(ids).then(fetchStateAttributes);
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
    return useQuery(CacheKey.GoToLocationPresets, fetchGoToLocationPresets, {
        staleTime: Infinity,
    });
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
    return useQuery(CacheKey.SystemHostInfo, fetchSystemHostInfo, {
        staleTime: Infinity,
    });
};
