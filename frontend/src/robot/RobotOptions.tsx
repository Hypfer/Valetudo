// noinspection HtmlUnknownAttribute

import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    AutoEmptyDockAutoEmptyInterval,
    Capability,
    CarpetSensorMode,
    useAutoEmptyDockAutoEmptyControlMutation,
    useAutoEmptyDockAutoEmptyControlQuery,
    useAutoEmptyDockAutoEmptyIntervalMutation,
    useAutoEmptyDockAutoEmptyIntervalPropertiesQuery,
    useAutoEmptyDockAutoEmptyIntervalQuery,
    useCarpetModeStateMutation,
    useCarpetModeStateQuery,
    useCarpetSensorModeMutation,
    useCarpetSensorModePropertiesQuery,
    useCarpetSensorModeQuery,
    useCollisionAvoidantNavigationControlMutation,
    useCollisionAvoidantNavigationControlQuery,
    useKeyLockStateMutation,
    useKeyLockStateQuery,
    useLocateMutation,
    useObstacleAvoidanceControlMutation,
    useObstacleAvoidanceControlQuery,
    usePetObstacleAvoidanceControlMutation,
    usePetObstacleAvoidanceControlQuery,
} from "../api";
import React from "react";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {
    AutoDelete as AutoEmptyIntervalControlIcon,
    Cable as ObstacleAvoidanceControlIcon,
    Delete as AutoEmptyControlIcon,
    Lock as KeyLockIcon,
    MiscellaneousServices as MiscIcon,
    NotListedLocation as LocateIcon,
    Pets as PetObstacleAvoidanceControlIcon,
    RoundaboutRight as CollisionAvoidantNavigationControlIcon,
    Sensors as CarpetModeIcon,
    Star as QuirksIcon,
    Waves as CarpetSensorModeIcon,
} from "@mui/icons-material";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {LinkListMenuItem} from "../components/list_menu/LinkListMenuItem";
import PaperContainer from "../components/PaperContainer";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {SelectListMenuItem, SelectListMenuItemOption} from "../components/list_menu/SelectListMenuItem";

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
            primaryLabel={"Lock keys"}
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
        "off": 3,
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

const AutoEmptyDockAutoEmptyControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useAutoEmptyDockAutoEmptyControlQuery();

    const {mutate: mutate, isPending: isChanging} = useAutoEmptyDockAutoEmptyControlMutation();
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
            primaryLabel={"Dock Auto-Empty"}
            secondaryLabel={"Automatically empty the robot into the dock."}
            icon={<AutoEmptyControlIcon/>}
        />
    );
};

const AutoEmptyDockAutoEmptyIntervalControlCapabilitySelectListMenuItem = () => {
    const SORT_ORDER = {
        "frequent": 1,
        "normal": 2,
        "infrequent": 3,
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
            primaryLabel="Auto-Empty Interval"
            secondaryLabel="Select how often the dock should auto-empty the robot."
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


const RobotOptions = (): React.ReactElement => {
    const [
        locateCapabilitySupported,

        obstacleAvoidanceControlCapabilitySupported,
        petObstacleAvoidanceControlCapabilitySupported,
        collisionAvoidantNavigationControlCapabilitySupported,
        carpetModeControlCapabilitySupported,
        carpetSensorModeControlCapabilitySupported,

        autoEmptyDockAutoEmptyControlCapabilitySupported,
        autoEmptyDockAutoEmptyIntervalControlCapabilitySupported,

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
        Capability.CollisionAvoidantNavigation,
        Capability.CarpetModeControl,
        Capability.CarpetSensorModeControl,

        Capability.AutoEmptyDockAutoEmptyControl,
        Capability.AutoEmptyDockAutoEmptyIntervalControl,

        Capability.KeyLock,

        Capability.SpeakerVolumeControl,
        Capability.SpeakerTest,
        Capability.VoicePackManagement,
        Capability.DoNotDisturb,

        Capability.Quirks
    );


    const actionListItems = React.useMemo(() => {
        const items = [];

        if (locateCapabilitySupported) {
            items.push(<LocateButtonListMenuItem key={"locateAction"}/>);
        }

        return items;
    }, [
        locateCapabilitySupported
    ]);

    const behaviorListItems = React.useMemo(() => {
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

        if (collisionAvoidantNavigationControlCapabilitySupported) {
            items.push(
                <CollisionAvoidantNavigationControlCapabilitySwitchListMenuItem key={"collisionAvoidantNavigationControl"}/>
            );
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

        return items;
    }, [
        obstacleAvoidanceControlCapabilitySupported,
        petObstacleAvoidanceControlCapabilitySupported,
        collisionAvoidantNavigationControlCapabilitySupported,
        carpetModeControlCapabilitySupported,
        carpetSensorModeControlCapabilitySupported
    ]);

    const dockListItems = React.useMemo(() => {
        const items = [];

        if (autoEmptyDockAutoEmptyControlCapabilitySupported) {
            items.push(
                <AutoEmptyDockAutoEmptyControlCapabilitySwitchListMenuItem key={"autoEmptyDockAutoEmptyControl"}/>
            );
        }
        if (autoEmptyDockAutoEmptyIntervalControlCapabilitySupported) {
            items.push(
                <AutoEmptyDockAutoEmptyIntervalControlCapabilitySelectListMenuItem key={"autoEmptyDockAutoEmptyIntervalControl"}/>
            );
        }

        return items;
    }, [
        autoEmptyDockAutoEmptyControlCapabilitySupported,
        autoEmptyDockAutoEmptyIntervalControlCapabilitySupported
    ]);

    const miscListItems = React.useMemo(() => {
        const items = [];

        if (keyLockControlCapabilitySupported) {
            items.push(
                <KeyLockCapabilitySwitchListMenuItem key={"keyLockControl"}/>
            );
        }

        return items;
    }, [
        keyLockControlCapabilitySupported
    ]);

    const submenuListItems = React.useMemo(() => {
        const items = [];

        if (
            speakerVolumeControlCapabilitySupported || speakerTestCapabilitySupported ||
            voicePackManagementCapabilitySupported ||
            doNotDisturbCapabilitySupported ||
            quirksCapabilitySupported
        ) {
            if (
                (speakerVolumeControlCapabilitySupported && speakerTestCapabilitySupported) ||
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
                        key="miscRobotSettings"
                        url="/options/robot/misc"
                        primaryLabel="Misc Options"
                        secondaryLabel={label.join(", ")}
                        icon={<MiscIcon/>}
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

        items.push(...actionListItems);

        if (behaviorListItems.length > 0) {
            items.push(<SpacerListMenuItem key={"spacer0"}/>);
        }
        items.push(...behaviorListItems);

        if (dockListItems.length > 0) {
            items.push(<SpacerListMenuItem key={"spacer1"}/>);
        }
        items.push(...dockListItems);

        if (miscListItems.length > 0) {
            items.push(<SpacerListMenuItem key={"spacer2"}/>);
        }
        items.push(...miscListItems);

        if (submenuListItems.length > 0) {
            items.push(<SpacerListMenuItem key={"spacer3"}/>);
        }
        items.push(...submenuListItems);


        return items;
    }, [
        actionListItems,
        behaviorListItems,
        dockListItems,
        miscListItems,
        submenuListItems
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
