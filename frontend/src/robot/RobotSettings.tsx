import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Capability,
    useAutoEmptyDockAutoEmptyControlMutation,
    useAutoEmptyDockAutoEmptyControlQuery,
    useCarpetModeStateMutation,
    useCarpetModeStateQuery,
    useKeyLockStateMutation,
    useKeyLockStateQuery,
} from "../api";
import React from "react";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {
    Lock as KeyLockIcon,
    Sensors as CarpetModeIcon,
    AutoDelete as AutoEmptyControlIcon,
    MiscellaneousServices as MiscIcon,
    Star as QuirksIcon
} from "@mui/icons-material";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {LinkListMenuItem} from "../components/list_menu/LinkListMenuItem";
import PaperContainer from "../components/PaperContainer";

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


const RobotSettings = (): JSX.Element => {
    const [
        keyLockControlCapabilitySupported,
        carpetModeControlCapabilitySupported,
        autoEmptyDockAutoEmptyControlCapabilitySupported,

        speakerVolumeControlCapabilitySupported,
        speakerTestCapabilitySupported,
        voicePackManagementCapabilitySupported,
        doNotDisturbCapabilitySupported,

        quirksCapabilitySupported,
    ] = useCapabilitiesSupported(
        Capability.KeyLock,
        Capability.CarpetModeControl,
        Capability.AutoEmptyDockAutoEmptyControl,

        Capability.SpeakerVolumeControl,
        Capability.SpeakerTest,
        Capability.VoicePackManagement,
        Capability.DoNotDisturb,

        Capability.Quirks
    );

    const listItems = React.useMemo(() => {
        const items = [];

        if (keyLockControlCapabilitySupported) {
            items.push(
                <KeyLockCapabilitySwitchListMenuItem key={"keyLockControl"}/>
            );
        }

        if (carpetModeControlCapabilitySupported) {
            items.push(
                <CarpetModeControlCapabilitySwitchListMenuItem key={"carpetModeControl"}/>
            );
        }

        if (autoEmptyDockAutoEmptyControlCapabilitySupported) {
            items.push(
                <AutoEmptyDockAutoEmptyControlCapabilitySwitchListMenuItem key={"autoEmptyControl"}/>
            );
        }

        if (
            speakerVolumeControlCapabilitySupported || speakerTestCapabilitySupported ||
            voicePackManagementCapabilitySupported ||
            doNotDisturbCapabilitySupported ||
            quirksCapabilitySupported
        ) {
            if (items.length > 0) {
                items.push(<SpacerListMenuItem key={"spacer1"}/>);
            }

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
                        url="/robot/settings/misc"
                        primaryLabel="Misc Settings"
                        secondaryLabel={label.join(", ")}
                        icon={<MiscIcon/>}
                    />
                );
            }

            if (quirksCapabilitySupported) {
                items.push(
                    <LinkListMenuItem
                        key="quirks"
                        url="/robot/settings/quirks"
                        primaryLabel="Quirks"
                        secondaryLabel="Configure firmware-specific quirks"
                        icon={<QuirksIcon/>}
                    />
                );
            }


        }

        return items;
    }, [
        keyLockControlCapabilitySupported,
        carpetModeControlCapabilitySupported,
        autoEmptyDockAutoEmptyControlCapabilitySupported,

        speakerVolumeControlCapabilitySupported,
        speakerTestCapabilitySupported,
        voicePackManagementCapabilitySupported,
        doNotDisturbCapabilitySupported,

        quirksCapabilitySupported,
    ]);

    return (
        <PaperContainer>
            <ListMenu
                primaryHeader={"Robot Settings"}
                secondaryHeader={"Configure settings and tunables provided by the robot's firmware"}
                listItems={listItems}
            />
        </PaperContainer>
    );
};

export default RobotSettings;
