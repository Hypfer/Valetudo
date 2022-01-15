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
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {CapabilityItem} from "./CapabilityLayout";

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
        keyLockControl,
        carpetModeControl,
        autoEmptyDockAutoEmptyControl
    ] = useCapabilitiesSupported(
        Capability.KeyLock,
        Capability.CarpetModeControl,
        Capability.AutoEmptyDockAutoEmptyControl
    );

    return (
        <CapabilityItem title={"Switches"}>
            {keyLockControl && <KeyLockSwitch/>}
            {carpetModeControl && <CarpetModeSwitch/>}
            {autoEmptyDockAutoEmptyControl && <AutoEmptyDockAutoEmptySwitch/>}
        </CapabilityItem>
    );
};

export default Switches;
