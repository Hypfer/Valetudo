import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Capability,
    useAutoEmptyDockAutoEmptyControlMutation,
    useAutoEmptyDockAutoEmptyControlQuery,
    useCarpetModeStateMutation,
    useCarpetModeStateQuery,
    useKeyLockStateMutation,
    useKeyLockStateQuery,
    useLocateMutation,
    useObstacleAvoidanceControlMutation,
    useObstacleAvoidanceControlQuery,
} from "../api";
import React from "react";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {
    AutoDelete as AutoEmptyControlIcon,
    Cable as ObstacleAvoidanceControlIcon,
    Lock as KeyLockIcon,
    MiscellaneousServices as MiscIcon,
    NotListedLocation as LocateIcon,
    Sensors as CarpetModeIcon,
    Star as QuirksIcon
} from "@mui/icons-material";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {LinkListMenuItem} from "../components/list_menu/LinkListMenuItem";
import PaperContainer from "../components/PaperContainer";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";

const LocateButtonListMenuItem = (): JSX.Element => {
    const {
        mutate: locate,
        isLoading: locateIsExecuting
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

    const {mutate: mutate, isLoading: isChanging} = useKeyLockStateMutation();
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

    const {mutate: mutate, isLoading: isChanging} = useCarpetModeStateMutation();
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
            primaryLabel={"Carpet mode"}
            secondaryLabel={"When enabled, the vacuum will recognize carpets automatically and increase the suction."}
            icon={<CarpetModeIcon/>}
        />
    );
};

const AutoEmptyDockAutoEmptyControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useAutoEmptyDockAutoEmptyControlQuery();

    const {mutate: mutate, isLoading: isChanging} = useAutoEmptyDockAutoEmptyControlMutation();
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
            primaryLabel={"Auto-Empty Dock"}
            secondaryLabel={"Enables automatic emptying of the robot into the dock. The interval between empties is robot-specific."}
            icon={<AutoEmptyControlIcon/>}
        />
    );
};

const ObstacleAvoidanceControlCapabilitySwitchListMenuItem = () => {
    const {
        data: data,
        isFetching: isFetching,
        isError: isError,
    } = useObstacleAvoidanceControlQuery();

    const {mutate: mutate, isLoading: isChanging} = useObstacleAvoidanceControlMutation();
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


const RobotOptions = (): JSX.Element => {
    const [
        locateCapabilitySupported,

        keyLockControlCapabilitySupported,
        carpetModeControlCapabilitySupported,
        autoEmptyDockAutoEmptyControlCapabilitySupported,
        obstacleAvoidanceControlCapabilitySupported,

        speakerVolumeControlCapabilitySupported,
        speakerTestCapabilitySupported,
        voicePackManagementCapabilitySupported,
        doNotDisturbCapabilitySupported,

        quirksCapabilitySupported,
    ] = useCapabilitiesSupported(
        Capability.Locate,

        Capability.KeyLock,
        Capability.CarpetModeControl,
        Capability.AutoEmptyDockAutoEmptyControl,
        Capability.ObstacleAvoidanceControl,

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

        if (carpetModeControlCapabilitySupported) {
            items.push(
                <CarpetModeControlCapabilitySwitchListMenuItem key={"carpetModeControl"}/>
            );
        }

        return items;
    }, [
        obstacleAvoidanceControlCapabilitySupported,
        carpetModeControlCapabilitySupported
    ]);

    const dockListItems = React.useMemo(() => {
        const items = [];

        if (autoEmptyDockAutoEmptyControlCapabilitySupported) {
            items.push(
                <AutoEmptyDockAutoEmptyControlCapabilitySwitchListMenuItem key={"autoEmptyControl"}/>
            );
        }

        return items;
    }, [
        autoEmptyDockAutoEmptyControlCapabilitySupported
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
        const items: Array<JSX.Element> = [];

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
