import React, {FunctionComponent} from "react";
import {FormControlLabel, Switch, Typography} from "@mui/material";
import {
    Capability,
    useAutoEmptyDockAutoEmptyControlMutation,
    useAutoEmptyDockAutoEmptyControlQuery,
    useCarpetModeStateMutation,
    useCarpetModeStateQuery,
    useKeyLockStateMutation,
    useKeyLockStateQuery,
    useStatusLEDStateMutation,
    useStatusLEDStateQuery,
    useObstacleAvoidanceModeStateMutation,
    useObstacleAvoidanceModeStateQuery,
    usePersistentDataMutation,
    usePersistentDataQuery,
    useButtonLightsStateQuery,
    useButtonLightsStateMutation
} from "../../api";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {CapabilityItem} from "./CapabilityLayout";

const PersistentDataSwitch = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {
        data: persistentData,
        isFetching: persistentDataLoading,
        isError: persistentDataError,
    } = usePersistentDataQuery();

    const {mutate: mutatePersistentData, isLoading: persistentDataChanging} = usePersistentDataMutation();
    const loading = persistentDataLoading || persistentDataChanging;
    const disabled = loading || persistentDataChanging || persistentDataError;

    if (persistentDataError) {
        return (
            <Typography variant="body2" color="error">
                Error loading persistent data state
            </Typography>
        );
    }

    return (
        <>
            <FormControlLabel control={
                <Switch disabled={disabled}
                    checked={persistentData?.enabled ?? false}
                    onChange={(e) => {
                        if (e.target.checked) {
                            mutatePersistentData(true);
                        } else {
                            setDialogOpen(true);
                        }
                    }}/>
            }
            label="Persistent data"/>
            <Typography variant="body2" sx={{mb: 1}}>
                Persistent data is a feature of some robots which allows to save no-go areas and virtual walls. It
                also allows the robot to drive back to the dock wherever it is and keeps the map from being rotated.
            </Typography>
            <ConfirmationDialog title="Delete persistent data?"
                text="Do you really want to disable persistent data? This deletes the current map, all no-go zones and virtual walls."
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    mutatePersistentData(false);
                }}/>
        </>
    );
};

const renderSwitch = (
    isError: boolean,
    loading: boolean,
    enabled: boolean,
    label: string,
    text: string,
    onChange: (enabled: boolean) => void,
    capability: Capability
) => {

    if (isError) {
        return (
            <Typography variant="body2" color="error">
                Error loading switch state for {capability}
            </Typography>
        );
    }

    return (
        <>
            <FormControlLabel control={
                <Switch disabled={loading}
                    checked={enabled}
                    onChange={(e) => {
                        onChange(e.target.checked);
                    }}/>
            }
            label={label}/>
            <Typography variant="body2" sx={{mb: 1}}>
                {text}
            </Typography>
        </>
    );
};

const KeyLockSwitch = () => {
    const {data, isFetching, isError} = useKeyLockStateQuery();
    const {mutate: onChange, isLoading: isChanging} = useKeyLockStateMutation();
    const loading = isFetching || isChanging;

    return renderSwitch(
        isError,
        loading,
        data?.enabled || false,
        "Lock keys",
        "Prevents the robot from being operated using its physical buttons.",
        onChange,
        Capability.KeyLock
    );
};

const StatusLEDControlSwitch = () => {
    const {data, isFetching, isError} = useStatusLEDStateQuery();
    const {mutate: onChange, isLoading: isChanging} = useStatusLEDStateMutation();
    const loading = isFetching || isChanging;

    return renderSwitch(
        isError,
        loading,
        data?.enabled || false,
        "Status indicator light",
        "",
        onChange,
        Capability.StatusLEDControl
    );
};

const ButtonLightsControlSwitch = () => {
    const {data, isFetching, isError} = useButtonLightsStateQuery();
    const {mutate: onChange, isLoading: isChanging} = useButtonLightsStateMutation();
    const loading = isFetching || isChanging;

    return renderSwitch(
        isError,
        loading,
        data?.enabled || false,
        "Button lights",
        "The light will go off 1 minute after the robot is fully charged. If the robot is already docked and fully charged, switching off this setting will take effect after 1 minute.",
        onChange,
        Capability.ButtonLightsControl
    );
};

const CarpetModeSwitch = () => {
    const {data, isFetching, isError} = useCarpetModeStateQuery();
    const {mutate: onChange, isLoading: isChanging} = useCarpetModeStateMutation();
    const loading = isFetching || isChanging;

    return renderSwitch(
        isError,
        loading,
        data?.enabled || false,
        "Carpet mode",
        "In carpet mode, the vacuum will recognize carpets automatically and increase the suction.",
        onChange,
        Capability.CarpetModeControl
    );
};

const ObstacleAvoidanceSwitch = () => {
    const {data, isFetching, isError} = useObstacleAvoidanceModeStateQuery();
    const {mutate: onChange, isLoading: isChanging} = useObstacleAvoidanceModeStateMutation();
    const loading = isFetching || isChanging;

    return renderSwitch(
        isError,
        loading,
        data?.enabled || false,
        "Obstacle avoidance",
        "Obstacle avoidance mode attempts to avoid obstacles using onboard sensors.",
        onChange,
        Capability.ObstacleAvoidanceControl
    );
};

const AutoEmptyDockAutoEmptySwitch = () => {
    const {data, isFetching, isError} = useAutoEmptyDockAutoEmptyControlQuery();
    const {mutate: onChange, isLoading: isChanging} = useAutoEmptyDockAutoEmptyControlMutation();
    const loading = isFetching || isChanging;

    return renderSwitch(
        isError,
        loading,
        data?.enabled || false,
        "Automatic empty into dock",
        "Enables automatic emptying of the robot into the dock. The interval between empties is robot-specific.",
        onChange,
        Capability.AutoEmptyDockAutoEmptyControl
    );
};

const Switches: FunctionComponent = () => {
    const [
        persistentMapControl,
        keyLockControl,
        ledControl,
        ButtonLightsControl,
        carpetModeControl,
        obstacleAvoidanceControl,
        autoEmptyDockAutoEmptyControl
    ] = useCapabilitiesSupported(
        Capability.PersistentMapControl,
        Capability.KeyLock,
        Capability.StatusLEDControl,
        Capability.ButtonLightsControl,
        Capability.CarpetModeControl,
        Capability.ObstacleAvoidanceControl,
        Capability.AutoEmptyDockAutoEmptyControl
    );

    return (
        <CapabilityItem title={"Switches"}>
            {persistentMapControl && <PersistentDataSwitch/>}
            {keyLockControl && <KeyLockSwitch/>}
            {ledControl && <StatusLEDControlSwitch/>}
            {ButtonLightsControl && <ButtonLightsControlSwitch/>}
            {carpetModeControl && <CarpetModeSwitch/>}
            {obstacleAvoidanceControl && <ObstacleAvoidanceSwitch/>}
            {autoEmptyDockAutoEmptyControl && <AutoEmptyDockAutoEmptySwitch/>}
        </CapabilityItem>
    );
};

export default Switches;
