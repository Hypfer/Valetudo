import React, {FunctionComponent} from "react";
import {Card, CardContent, Divider, FormControlLabel, Switch, Typography} from "@material-ui/core";
import {
    Capability,
    useAutoEmptyDockAutoEmptyControlMutation,
    useAutoEmptyDockAutoEmptyControlQuery,
    useCarpetModeStateMutation,
    useCarpetModeStateQuery,
    useKeyLockStateMutation,
    useKeyLockStateQuery,
    useObstacleAvoidanceModeStateMutation,
    useObstacleAvoidanceModeStateQuery,
    usePersistentDataMutation,
    usePersistentDataQuery
} from "../../api";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";

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
                    checked={persistentData?.enabled}
                    onChange={(e) => {
                        if (e.target.checked) {
                            mutatePersistentData(true);
                        } else {
                            setDialogOpen(true);
                        }
                    }}/>
            }
            label="Persistent data"
            sx={{mt: 1}}/>
            <Typography variant="body2">
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
            label={label} sx={{mt: 1}}/>
            <Typography variant="body2">
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
        carpetModeControl,
        obstacleAvoidanceControl,
        autoEmptyDockAutoEmptyControl
    ] = useCapabilitiesSupported(
        Capability.PersistentMapControl,
        Capability.KeyLock,
        Capability.CarpetModeControl,
        Capability.ObstacleAvoidanceControl,
        Capability.AutoEmptyDockAutoEmptyControl
    );

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Switches
                </Typography>
                <Divider/>
                {persistentMapControl && <PersistentDataSwitch/>}
                {keyLockControl && <KeyLockSwitch/>}
                {carpetModeControl && <CarpetModeSwitch/>}
                {obstacleAvoidanceControl && <ObstacleAvoidanceSwitch/>}
                {autoEmptyDockAutoEmptyControl && <AutoEmptyDockAutoEmptySwitch/>}
            </CardContent>
        </Card>
    );
};

export default Switches;
