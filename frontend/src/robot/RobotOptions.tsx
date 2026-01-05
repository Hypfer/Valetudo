// noinspection HtmlUnknownAttribute

import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    AutoEmptyDockAutoEmptyInterval,
    Capability,
    CarpetSensorMode,
    CleanRoute,
    MopDockMopDryingDuration,
    MopDockMopWashTemperature,
    useAutoEmptyDockAutoEmptyIntervalMutation,
    useAutoEmptyDockAutoEmptyIntervalPropertiesQuery,
    useAutoEmptyDockAutoEmptyIntervalQuery,
    useCameraLightControlMutation,
    useCameraLightControlQuery,
    useCarpetModeStateMutation,
    useCarpetModeStateQuery,
    useCarpetSensorModeMutation,
    useCarpetSensorModePropertiesQuery,
    useCarpetSensorModeQuery,
    useCleanRouteControlPropertiesQuery,
    useCleanRouteMutation,
    useCleanRouteQuery,
    useCollisionAvoidantNavigationControlMutation,
    useCollisionAvoidantNavigationControlQuery,
    useFloorMaterialDirectionAwareNavigationControlMutation,
    useFloorMaterialDirectionAwareNavigationControlQuery,
    useKeyLockStateMutation,
    useKeyLockStateQuery,
    useLocateMutation,
    useMopDockMopAutoDryingControlMutation,
    useMopDockMopAutoDryingControlQuery,
    useMopDockMopDryingTimeControlPropertiesQuery,
    useMopDockMopDryingTimeMutation,
    useMopDockMopDryingTimeQuery,
    useMopDockMopWashTemperatureMutation,
    useMopDockMopWashTemperaturePropertiesQuery,
    useMopDockMopWashTemperatureQuery,
    useMopExtensionControlMutation,
    useMopExtensionControlQuery,
    useMopExtensionFurnitureLegHandlingControlMutation,
    useMopExtensionFurnitureLegHandlingControlQuery,
    useMopTwistControlMutation,
    useMopTwistControlQuery,
    useObstacleAvoidanceControlMutation,
    useObstacleAvoidanceControlQuery,
    useObstacleImagesMutation,
    useObstacleImagesQuery,
    usePetObstacleAvoidanceControlMutation,
    usePetObstacleAvoidanceControlQuery,
} from "../api";
import React from "react";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {
    Air as MopDockMopAutoDryingControlIcon,
    AvTimer as MopDockMopDryingTimeControlIcon,
    AutoDelete as AutoEmptyIntervalControlIcon,
    Cable as ObstacleAvoidanceControlIcon,
    DeviceThermostat as MopDockMopWashTemperatureControlIcon,
    Explore as FloorMaterialDirectionAwareNavigationControlIcon,
    FlashlightOn as CameraLightControlIcon,
    KeyboardDoubleArrowUp as CarpetModeIcon,
    Lock as KeyLockIcon,
    MiscellaneousServices as SystemIcon,
    NotListedLocation as LocateIcon,
    Pets as PetObstacleAvoidanceControlIcon,
    Photo as ObstacleImagesIcon,
    RoundaboutRight as CollisionAvoidantNavigationControlIcon,
    Route as CleanRouteControlIcon,
    SatelliteAlt as PerceptionIcon,
    Schema as BehaviourIcon,
    Settings as GeneralIcon,
    Star as QuirksIcon,
    TableBar as MopExtensionFurnitureLegHandlingControlIcon,
    Troubleshoot as CarpetSensorModeIcon,
    Tune as MiscIcon,
    Villa as DockIcon
} from "@mui/icons-material";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {LinkListMenuItem} from "../components/list_menu/LinkListMenuItem";
import PaperContainer from "../components/PaperContainer";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {SelectListMenuItem, SelectListMenuItemOption} from "../components/list_menu/SelectListMenuItem";
import {SubHeaderListMenuItem} from "../components/list_menu/SubHeaderListMenuItem";
import {
    MopExtensionControlCapability as MopExtensionControlCapabilityIcon,
    MopTwistControlCapability as MopTwistControlCapabilityIcon,
    MopTwistControlCapabilityExtended as MopTwistControlCapabilityExtendedIcon,
} from "../components/CustomIcons";

const LocateButtonListMenuItem = (): React.ReactElement => {
    const {
        mutate: locate,
        isPending: locateIsExecuting
    } = useLocateMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Locate Robot"
            secondaryLabel="The robot will play a sound to announce its location"
            icon={<LocateIcon/>}
            buttonLabel="Go"
            action={() => {
                locate();
            }}
            actionLoading={locateIsExecuting}
        />
    );
};

const KeyLockCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useKeyLockStateQuery();

    const {mutate: mutate, isPending: isChanging} = useKeyLockStateMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Lock Keys"}
            secondaryLabel={"Prevents the robot from being operated using its physical buttons."}
            icon={<KeyLockIcon/>}
        />
    );
};

const CarpetModeControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useCarpetModeStateQuery();

    const {mutate: mutate, isPending: isChanging} = useCarpetModeStateMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Carpet Mode"}
            secondaryLabel={"When enabled, the vacuum will recognize carpets automatically and increase the suction."}
            icon={<CarpetModeIcon/>}
        />
    );
};

const CarpetSensorModeControlCapabilitySelectListMenuItem = () => {
    const SORT_ORDER = {
        "off": 4,
        "detach": 3,
        "avoid": 2,
        "lift": 1
    };

    const {
        data: carpetSensorModeProperties,
        isPending: carpetSensorModePropertiesPending,
        isError: carpetSensorModePropertiesError
    } = useCarpetSensorModePropertiesQuery();

    const options: Array<SelectListMenuItemOption> = (
        carpetSensorModeProperties?.supportedModes ?? []
    ).sort((a, b) => {
        const aMapped = SORT_ORDER[a] ?? 10;
        const bMapped = SORT_ORDER[b] ?? 10;

        if (aMapped < bMapped) {
            return -1;
        } else if (bMapped < aMapped) {
            return 1;
        } else {
            return 0;
        }
    }).map((val: CarpetSensorMode) => {
        let label;

        switch (val) {
            case "off":
                label = "None";
                break;
            case "avoid":
                label = "Avoid Carpet";
                break;
            case "lift":
                label = "Lift Mop";
                break;
            case "detach":
                label = "Detach Mop";
                break;
        }

        return {
            value: val,
            label: label
        };
    });


    const {
        data: data,
        isPending: isPending,
        isFetching: isFetching,
        isError: isError,
    } = useCarpetSensorModeQuery();

    const {mutate: mutate, isPending: isChanging} = useCarpetSensorModeMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    const currentValue = options.find(mode => {
        return mode.value === data;
    }) ?? {value: "", label: ""};


    return (
        <SelectListMenuItem
            options={options}
            currentValue={currentValue}
            setValue={(e) => {
                mutate(e.value as CarpetSensorMode);
            }}
            disabled={disabled}
            loadingOptions={carpetSensorModePropertiesPending || isPending}
            loadError={carpetSensorModePropertiesError}
            primaryLabel="Carpet Sensor"
            secondaryLabel="Select what action the robot should take if it detects carpet while mopping."
            icon={<CarpetSensorModeIcon/>}
        />
    );
};

const AutoEmptyDockAutoEmptyIntervalControlCapabilitySelectListMenuItem = () => {
    const SORT_ORDER = {
        "frequent": 1,
        "normal": 2,
        "infrequent": 3,
        "off": 4
    };

    const {
        data: autoEmptyDockAutoEmptyIntervalProperties,
        isPending: autoEmptyDockAutoEmptyIntervalPropertiesPending,
        isError: autoEmptyDockAutoEmptyIntervalPropertiesError
    } = useAutoEmptyDockAutoEmptyIntervalPropertiesQuery();

    const options: Array<SelectListMenuItemOption> = (
        autoEmptyDockAutoEmptyIntervalProperties?.supportedIntervals ?? []
    ).sort((a, b) => {
        const aMapped = SORT_ORDER[a] ?? 10;
        const bMapped = SORT_ORDER[b] ?? 10;

        if (aMapped < bMapped) {
            return -1;
        } else if (bMapped < aMapped) {
            return 1;
        } else {
            return 0;
        }
    }).map((val: AutoEmptyDockAutoEmptyInterval) => {
        let label;

        switch (val) {
            case "frequent":
                label = "Frequent";
                break;
            case "normal":
                label = "Normal";
                break;
            case "infrequent":
                label = "Infrequent";
                break;
            case "off":
                label = "Off";
                break;
        }

        return {
            value: val,
            label: label
        };
    });


    const {
        data: data,
        isPending: isPending,
        isFetching: isFetching,
        isError: isError,
    } = useAutoEmptyDockAutoEmptyIntervalQuery();

    const {mutate: mutate, isPending: isChanging} = useAutoEmptyDockAutoEmptyIntervalMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    const currentValue = options.find(mode => {
        return mode.value === data;
    }) ?? {value: "", label: ""};


    return (
        <SelectListMenuItem
            options={options}
            currentValue={currentValue}
            setValue={(e) => {
                mutate(e.value as AutoEmptyDockAutoEmptyInterval);
            }}
            disabled={disabled}
            loadingOptions={autoEmptyDockAutoEmptyIntervalPropertiesPending || isPending}
            loadError={autoEmptyDockAutoEmptyIntervalPropertiesError}
            primaryLabel="Dock Auto-Empty"
            secondaryLabel="Select if and/or how often the dock should auto-empty the robot."
            icon={<AutoEmptyIntervalControlIcon/>}
        />
    );
};


const ObstacleAvoidanceControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useObstacleAvoidanceControlQuery();

    const {mutate: mutate, isPending: isChanging} = useObstacleAvoidanceControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Obstacle Avoidance"}
            secondaryLabel={"Avoid obstacles using sensors such as lasers or cameras. May suffer from false positives."}
            icon={<ObstacleAvoidanceControlIcon/>}
        />
    );
};

const PetObstacleAvoidanceControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = usePetObstacleAvoidanceControlQuery();

    const {mutate: mutate, isPending: isChanging} = usePetObstacleAvoidanceControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Pet Obstacle Avoidance"}
            secondaryLabel={"Fine-tune obstacle avoidance to avoid obstacles left by pets. Will increase the general false positive rate."}
            icon={<PetObstacleAvoidanceControlIcon/>}
        />
    );
};

const ObstacleImagesCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useObstacleImagesQuery();

    const {mutate: mutate, isPending: isChanging} = useObstacleImagesMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Obstacle Images"}
            secondaryLabel={"Take pictures of all encountered obstacles."}
            icon={<ObstacleImagesIcon/>}
        />
    );
};

const CollisionAvoidantNavigationControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useCollisionAvoidantNavigationControlQuery();

    const {mutate: mutate, isPending: isChanging} = useCollisionAvoidantNavigationControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Collision-avoidant Navigation"}
            secondaryLabel={"Drive a more conservative route to reduce collisions. May cause missed spots."}
            icon={<CollisionAvoidantNavigationControlIcon/>}
        />
    );
};

const MopExtensionControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useMopExtensionControlQuery();

    const {mutate: mutate, isPending: isChanging} = useMopExtensionControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Mop Extension"}
            secondaryLabel={"Extend the mop outwards to reach closer to walls and furniture."}
            icon={<MopExtensionControlCapabilityIcon/>}
        />
    );
};

const CameraLightControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useCameraLightControlQuery();

    const {mutate: mutate, isPending: isChanging} = useCameraLightControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Camera Light"}
            secondaryLabel={"Illuminate the dark to improve the AI image recognition obstacle avoidance."}
            icon={<CameraLightControlIcon/>}
        />
    );
};

const MopDockMopWashTemperatureControlCapabilitySelectListMenuItem = () => {
    const SORT_ORDER: Record<MopDockMopWashTemperature, number> = {
        "cold": 1,
        "warm": 2,
        "hot": 3,
        "scalding": 4,
        "boiling": 5,
    };

    const {
        data: mopDockMopWashTemperatureProperties,
        isPending: mopDockMopWashTemperaturePropertiesPending,
        isError: mopDockMopWashTemperaturePropertiesError
    } = useMopDockMopWashTemperaturePropertiesQuery();

    const options: Array<SelectListMenuItemOption> = (
        mopDockMopWashTemperatureProperties?.supportedTemperatures ?? []
    ).sort((a, b) => {
        const aMapped = SORT_ORDER[a] ?? 10;
        const bMapped = SORT_ORDER[b] ?? 10;

        return aMapped - bMapped;
    }).map((val: MopDockMopWashTemperature) => {
        let label;

        switch (val) {
            case "cold":
                label = "Cold";
                break;
            case "warm":
                label = "Warm";
                break;
            case "hot":
                label = "Hot";
                break;
            case "scalding":
                label = "Scalding";
                break;
            case "boiling":
                label = "Boiling";
                break;
        }

        return {
            value: val,
            label: label
        };
    });


    const {
        data: data,
        isPending: isPending,
        isFetching: isFetching,
        isError: isError,
    } = useMopDockMopWashTemperatureQuery();

    const {mutate: mutate, isPending: isChanging} = useMopDockMopWashTemperatureMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    const currentValue = options.find(mode => {
        return mode.value === data;
    }) ?? {value: "", label: ""};


    return (
        <SelectListMenuItem
            options={options}
            currentValue={currentValue}
            setValue={(e) => {
                mutate(e.value as MopDockMopWashTemperature);
            }}
            disabled={disabled}
            loadingOptions={mopDockMopWashTemperaturePropertiesPending || isPending}
            loadError={mopDockMopWashTemperaturePropertiesError}
            primaryLabel="Mop Wash Temperature"
            secondaryLabel="Select if and/or how much the dock should heat the water used to rinse the mop pads."
            icon={<MopDockMopWashTemperatureControlIcon/>}
        />
    );
};

const MopTwistControlCapabilitySwitchListMenuItem = () => {
    const [
        mopExtensionControlCapabilitySupported,
    ] = useCapabilitiesSupported(
        Capability.MopExtensionControl
    );

    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useMopTwistControlQuery();

    const {mutate: mutate, isPending: isChanging} = useMopTwistControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    let label;
    let icon;
    if (mopExtensionControlCapabilitySupported) {
        label = "With the mop extended, twist the robot to further reach below furniture and other overhangs.";
        icon = <MopTwistControlCapabilityExtendedIcon/>;
    } else {
        label = "Twist the robot to mop closer to walls and furniture. Will increase the cleanup duration.";
        icon = <MopTwistControlCapabilityIcon/>;
    }

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Mop Twist"}
            secondaryLabel={label}
            icon={icon}
        />
    );
};

const MopExtensionFurnitureLegHandlingControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useMopExtensionFurnitureLegHandlingControlQuery();

    const {mutate: mutate, isPending: isChanging} = useMopExtensionFurnitureLegHandlingControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Mop Extension for Furniture Legs"}
            secondaryLabel={"Use the extending mop to mop up close to legs of chairs and tables."}
            icon={<MopExtensionFurnitureLegHandlingControlIcon/>}
        />
    );
};

const MopDockMopAutoDryingControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useMopDockMopAutoDryingControlQuery();

    const {mutate: mutate, isPending: isChanging} = useMopDockMopAutoDryingControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Mop Auto-Drying"}
            secondaryLabel={"Automatically dry the mop pads after a cleanup."}
            icon={<MopDockMopAutoDryingControlIcon/>}
        />
    );
};

const FloorMaterialDirectionAwareNavigationControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useFloorMaterialDirectionAwareNavigationControlQuery();

    const {mutate: mutate, isPending: isChanging} = useFloorMaterialDirectionAwareNavigationControlMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    return (
        <ToggleSwitchListMenuItem
            value={data?.enabled ?? false}
            setValue={(value) => {
                mutate(value);
            }}
            disabled={disabled}
            loadError={isError}
            primaryLabel={"Material-aligned Navigation"}
            secondaryLabel={"Clean along the direction of the configured/detected floor material (if applicable)."}
            icon={<FloorMaterialDirectionAwareNavigationControlIcon/>}
        />
    );
};

const CleanRouteControlCapabilitySelectListMenuItem = () => {
    const SORT_ORDER = {
        "quick": 1,
        "normal": 2,
        "intensive": 3,
        "deep": 4
    };

    const {
        data: cleanRouteControlProperties,
        isPending: cleanRouteControlPropertiesPending,
        isError: cleanRouteControlPropertiesError
    } = useCleanRouteControlPropertiesQuery();

    const options: Array<SelectListMenuItemOption> = (
        cleanRouteControlProperties?.supportedRoutes ?? []
    ).sort((a, b) => {
        const aMapped = SORT_ORDER[a] ?? 10;
        const bMapped = SORT_ORDER[b] ?? 10;

        if (aMapped < bMapped) {
            return -1;
        } else if (bMapped < aMapped) {
            return 1;
        } else {
            return 0;
        }
    }).map((val: CleanRoute) => {
        let label;

        switch (val) {
            case "quick":
                label = "Quick";
                break;
            case "normal":
                label = "Normal";
                break;
            case "intensive":
                label = "Intensive";
                break;
            case "deep":
                label = "Deep";
                break;
        }

        return {
            value: val,
            label: label
        };
    });

    const description = React.useMemo(() => {
        let desc = "Trade speed for thoroughness and vice-versa.";

        if (cleanRouteControlProperties) {
            if (cleanRouteControlProperties.mopOnly.length > 0) {
                const labels = cleanRouteControlProperties.mopOnly.map(route => {
                    const label = options.find(o => o.value === route)?.label ?? "unknown";

                    return `"${label}"`;
                });

                desc += ` ${labels.join(", ")} only ${labels.length > 1 ? "apply" : "applies"} when mopping.`;
            }

            if (cleanRouteControlProperties.oneTime.length > 0) {
                const labels = cleanRouteControlProperties.oneTime.map(route => {
                    const label = options.find(o => o.value === route)?.label ?? "unknown";

                    return `"${label}"`;
                });

                desc += ` ${labels.join(", ")} ${labels.length > 1 ? "are" : "is"} one-time only.`;
            }
        }

        return desc;
    }, [cleanRouteControlProperties, options]);


    const {
        data: data,
        isPending: isPending,
        isFetching: isFetching,
        isError: isError,
    } = useCleanRouteQuery();

    const {mutate: mutate, isPending: isChanging} = useCleanRouteMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    const currentValue = options.find(mode => {
        return mode.value === data;
    }) ?? {value: "", label: ""};


    return (
        <SelectListMenuItem
            options={options}
            currentValue={currentValue}
            setValue={(e) => {
                mutate(e.value as CleanRoute);
            }}
            disabled={disabled}
            loadingOptions={cleanRouteControlPropertiesPending || isPending}
            loadError={cleanRouteControlPropertiesError}
            primaryLabel="Clean Route"
            secondaryLabel={description}
            icon={<CleanRouteControlIcon/>}
        />
    );
};

const MopDockMopDryingTimeControlCapabilitySelectListMenuItem = () => {
    const SORT_ORDER = {
        "2h": 1,
        "3h": 2,
        "4h": 3,
        "cold": 4
    };

    const {
        data: mopDryingTimeProperties,
        isPending: mopDryingTimePropertiesPending,
        isError: mopDryingTimePropertiesError
    } = useMopDockMopDryingTimeControlPropertiesQuery();

    const options: Array<SelectListMenuItemOption> = (
        mopDryingTimeProperties?.supportedDurations ?? []
    ).sort((a, b) => {
        const aMapped = SORT_ORDER[a] ?? 10;
        const bMapped = SORT_ORDER[b] ?? 10;

        if (aMapped < bMapped) {
            return -1;
        } else if (bMapped < aMapped) {
            return 1;
        } else {
            return 0;
        }
    }).map((val: MopDockMopDryingDuration) => {
        let label;

        switch (val) {
            case "2h":
                label = "2 Hours";
                break;
            case "3h":
                label = "3 Hours";
                break;
            case "4h":
                label = "4 Hours";
                break;
            case "cold":
                label = "Cold";
                break;
        }

        return {
            value: val,
            label: label
        };
    });

    const description = React.useMemo(() => {
        let desc = "Select how long the mop should be dried with hot air after a cleanup.";

        if (mopDryingTimeProperties?.supportedDurations?.includes("cold")) {
            desc += " \"Cold\" disables the heater and compensates with far longer runtimes.";
        }

        return desc;
    }, [mopDryingTimeProperties]);


    const {
        data: data,
        isPending: isPending,
        isFetching: isFetching,
        isError: isError,
    } = useMopDockMopDryingTimeQuery();

    const {mutate: mutate, isPending: isChanging} = useMopDockMopDryingTimeMutation();
    const loading = isFetching || isChanging;
    const disabled = loading || isChanging || isError;

    const currentValue = options.find(mode => {
        return mode.value === data;
    }) ?? {value: "", label: ""};


    return (
        <SelectListMenuItem
            options={options}
            currentValue={currentValue}
            setValue={(e) => {
                mutate(e.value as MopDockMopDryingDuration);
            }}
            disabled={disabled}
            loadingOptions={mopDryingTimePropertiesPending || isPending}
            loadError={mopDryingTimePropertiesError}
            primaryLabel="Mop Drying Time"
            secondaryLabel={description}
            icon={<MopDockMopDryingTimeControlIcon/>}
        />
    );
};


const RobotOptions = (): React.ReactElement => {
    const [
        locateCapabilitySupported,

        obstacleAvoidanceControlCapabilitySupported,
        petObstacleAvoidanceControlCapabilitySupported,
        cameraLightControlSupported,
        obstacleImagesSupported,
        collisionAvoidantNavigationControlCapabilitySupported,
        floorMaterialDirectionAwareNavigationControlSupported,
        cleanRouteControlSupported,
        carpetModeControlCapabilitySupported,
        carpetSensorModeControlCapabilitySupported,

        mopExtensionControlCapabilitySupported,
        mopTwistControlSupported,
        mopExtensionFurnitureLegHandlingControlSupported,

        autoEmptyDockAutoEmptyIntervalControlCapabilitySupported,
        mopDockMopAutoDryingControlSupported,
        mopDockMopDryingTimeControlSupported,
        mopDockMopWashTemperatureControlSupported,

        keyLockControlCapabilitySupported,

        speakerVolumeControlCapabilitySupported,
        speakerTestCapabilitySupported,
        voicePackManagementCapabilitySupported,
        doNotDisturbCapabilitySupported,

        quirksCapabilitySupported,
    ] = useCapabilitiesSupported(
        Capability.Locate,

        Capability.ObstacleAvoidanceControl,
        Capability.PetObstacleAvoidanceControl,
        Capability.CameraLightControl,
        Capability.ObstacleImages,
        Capability.CollisionAvoidantNavigation,
        Capability.FloorMaterialDirectionAwareNavigationControl,
        Capability.CleanRouteControl,
        Capability.CarpetModeControl,
        Capability.CarpetSensorModeControl,

        Capability.MopExtensionControl,
        Capability.MopTwistControl,
        Capability.MopExtensionFurnitureLegHandlingControl,

        Capability.AutoEmptyDockAutoEmptyIntervalControl,
        Capability.MopDockMopAutoDryingControl,
        Capability.MopDockMopDryingTimeControl,
        Capability.MopDockMopWashTemperatureControl,

        Capability.KeyLock,

        Capability.SpeakerVolumeControl,
        Capability.SpeakerTest,
        Capability.VoicePackManagement,
        Capability.DoNotDisturb,

        Capability.Quirks
    );


    const generalListItems = React.useMemo(() => {
        const items = [];

        if (locateCapabilitySupported) {
            items.push(<LocateButtonListMenuItem key={"locateAction"}/>);
        }
        if (keyLockControlCapabilitySupported) {
            items.push(
                <KeyLockCapabilitySwitchListMenuItem key={"keyLockControl"}/>
            );
        }

        return items;
    }, [
        locateCapabilitySupported,
        keyLockControlCapabilitySupported
    ]);


    const behaviorListItems = React.useMemo(() => {
        const items = [];

        if (collisionAvoidantNavigationControlCapabilitySupported) {
            items.push(
                <CollisionAvoidantNavigationControlCapabilitySwitchListMenuItem key={"collisionAvoidantNavigationControl"}/>
            );
        }

        if (floorMaterialDirectionAwareNavigationControlSupported) {
            items.push(<FloorMaterialDirectionAwareNavigationControlCapabilitySwitchListMenuItem
                key="floorMaterialDirectionAwareNavigationControl"
            />);
        }

        if (cleanRouteControlSupported) {
            items.push(<CleanRouteControlCapabilitySelectListMenuItem key="cleanRouteControl"/>);
        }

        if (
            collisionAvoidantNavigationControlCapabilitySupported ||
            floorMaterialDirectionAwareNavigationControlSupported ||
            cleanRouteControlSupported
        ) {
            items.push(<SpacerListMenuItem key={"spacer-navigation"} halfHeight={true}/>);
        }

        if (carpetModeControlCapabilitySupported) {
            items.push(
                <CarpetModeControlCapabilitySwitchListMenuItem key={"carpetModeControl"}/>
            );
        }
        if (carpetSensorModeControlCapabilitySupported) {
            items.push(
                <CarpetSensorModeControlCapabilitySelectListMenuItem key={"carpetSensorModeControl"}/>
            );
        }

        if (carpetModeControlCapabilitySupported || carpetSensorModeControlCapabilitySupported) {
            items.push(<SpacerListMenuItem key={"spacer-carpet"} halfHeight={true}/>);
        }

        if (mopExtensionControlCapabilitySupported) {
            items.push(
                <MopExtensionControlCapabilitySwitchListMenuItem key={"mopExtensionControl"}/>
            );
        }

        if (mopTwistControlSupported) {
            items.push(
                <MopTwistControlCapabilitySwitchListMenuItem key={"mopTwistControl"}/>
            );
        }

        if (mopExtensionFurnitureLegHandlingControlSupported) {
            items.push(
                <MopExtensionFurnitureLegHandlingControlCapabilitySwitchListMenuItem
                    key={"mopExtensionFurnitureLegHandlingControl"}
                />
            );
        }

        if (items.at(-1)?.type === SpacerListMenuItem) {
            items.pop();
        }

        return items;
    }, [
        collisionAvoidantNavigationControlCapabilitySupported,
        floorMaterialDirectionAwareNavigationControlSupported,
        cleanRouteControlSupported,
        carpetModeControlCapabilitySupported,
        carpetSensorModeControlCapabilitySupported,
        mopExtensionControlCapabilitySupported,
        mopTwistControlSupported,
        mopExtensionFurnitureLegHandlingControlSupported,
    ]);

    const navigationListItems = React.useMemo(() => {
        const items = [];

        if (obstacleAvoidanceControlCapabilitySupported) {
            items.push(
                <ObstacleAvoidanceControlCapabilitySwitchListMenuItem key={"obstacleAvoidanceControl"}/>
            );
        }

        if (petObstacleAvoidanceControlCapabilitySupported) {
            items.push(
                <PetObstacleAvoidanceControlCapabilitySwitchListMenuItem key={"petObstacleAvoidanceControl"}/>
            );
        }

        if (obstacleImagesSupported) {
            items.push(
                <ObstacleImagesCapabilitySwitchListMenuItem key={"obstacleImages"}/>
            );
        }

        if (cameraLightControlSupported) {
            items.push(
                <CameraLightControlCapabilitySwitchListMenuItem key={"cameraLightControl"}/>
            );
        }

        return items;
    }, [
        obstacleAvoidanceControlCapabilitySupported,
        petObstacleAvoidanceControlCapabilitySupported,
        obstacleImagesSupported,
        cameraLightControlSupported,
    ]);

    const dockListItems = React.useMemo(() => {
        const items = [];

        if (autoEmptyDockAutoEmptyIntervalControlCapabilitySupported) {
            items.push(
                <AutoEmptyDockAutoEmptyIntervalControlCapabilitySelectListMenuItem
                    key={"autoEmptyDockAutoEmptyIntervalControl"}
                />
            );
        }

        if (mopDockMopWashTemperatureControlSupported) {
            items.push(
                <MopDockMopWashTemperatureControlCapabilitySelectListMenuItem key={"mopDockMopWashTemperatureControl"}/>
            );
        }

        if (mopDockMopAutoDryingControlSupported) {
            items.push(<MopDockMopAutoDryingControlCapabilitySwitchListMenuItem key="mopDockAutoDryingControl"/>);
        }

        if (mopDockMopDryingTimeControlSupported) {
            items.push(<MopDockMopDryingTimeControlCapabilitySelectListMenuItem key="mopDockMopDryingTimeControl"/>);
        }

        return items;
    }, [
        autoEmptyDockAutoEmptyIntervalControlCapabilitySupported,
        mopDockMopWashTemperatureControlSupported,
        mopDockMopAutoDryingControlSupported,
        mopDockMopDryingTimeControlSupported,
    ]);

    const miscListItems = React.useMemo(() => {
        const items = [];

        if (
            speakerVolumeControlCapabilitySupported || speakerTestCapabilitySupported ||
            voicePackManagementCapabilitySupported ||
            doNotDisturbCapabilitySupported
        ) {
            const label = [];

            if (voicePackManagementCapabilitySupported) {
                label.push("Voice packs");
            }

            if (doNotDisturbCapabilitySupported) {
                label.push("Do not disturb");
            }

            if (speakerVolumeControlCapabilitySupported && speakerTestCapabilitySupported) {
                label.push("Speaker settings");
            }

            items.push(
                <LinkListMenuItem
                    key="systemRobotSettings"
                    url="/options/robot/system"
                    primaryLabel="System Options"
                    secondaryLabel={label.join(", ")}
                    icon={<SystemIcon/>}
                />
            );
        }

        if (quirksCapabilitySupported) {
            items.push(
                <LinkListMenuItem
                    key="quirks"
                    url="/options/robot/quirks"
                    primaryLabel="Quirks"
                    secondaryLabel="Configure firmware-specific quirks"
                    icon={<QuirksIcon/>}
                />
            );
        }

        return items;
    }, [
        speakerVolumeControlCapabilitySupported,
        speakerTestCapabilitySupported,
        voicePackManagementCapabilitySupported,
        doNotDisturbCapabilitySupported,

        quirksCapabilitySupported,
    ]);

    const listItems = React.useMemo(() => {
        const items: Array<React.ReactElement> = [];

        const addGroup = (groupItems: React.ReactElement[], title: string, icon: React.ReactElement) => {
            if (groupItems.length > 0) {
                items.push(
                    <SubHeaderListMenuItem
                        key={`header-${title}`}
                        primaryLabel={title}
                        icon={icon}
                    />
                );
                items.push(...groupItems);
                items.push(<SpacerListMenuItem key={`spacer-${title}`}/>);
            }
        };

        addGroup(generalListItems, "General", <GeneralIcon/>);
        addGroup(behaviorListItems, "Behavior", <BehaviourIcon/>);
        addGroup(navigationListItems, "Perception", <PerceptionIcon/>);
        addGroup(dockListItems, "Dock", <DockIcon/>);
        addGroup(miscListItems, "Misc", <MiscIcon/>);

        if (items.at(-1)?.type === SpacerListMenuItem) {
            items.pop();
        }

        return items;
    }, [
        generalListItems,
        navigationListItems,
        behaviorListItems,
        dockListItems,
        miscListItems
    ]);

    return (
        <PaperContainer>
            <ListMenu
                primaryHeader={"Robot Options"}
                secondaryHeader={"Tunables and actions provided by the robot's firmware"}
                listItems={listItems}
            />
        </PaperContainer>
    );
};

export default RobotOptions;
