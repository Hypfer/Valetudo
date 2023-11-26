import React, {FunctionComponent} from "react";
import {Checkbox, FormControlLabel, Stack, Typography} from "@mui/material";
import {
    Capability,
    DoNotDisturbConfiguration,
    DoNotDisturbTime,
    useDoNotDisturbConfigurationQuery,
    useDoNotDisturbConfigurationMutation
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {LoadingButton} from "@mui/lab";
import {deepCopy} from "../../utils";
import {CapabilityItem} from "./CapabilityLayout";
import {DoNotDisturbHelp} from "./res/DoNotDisturbHelp";
import {TimePicker} from "@mui/x-date-pickers";

const formatTime = (value: DoNotDisturbTime | undefined): string => {
    if (!value) {
        return "??:??";
    }
    return `${value.hour.toString().padStart(2, "0")}:${value.minute.toString().padStart(2, "0")}`;
};

const DoNotDisturbControl: FunctionComponent = () => {
    const {
        data: dndConfiguration,
        isFetching: dndConfigurationFetching,
        isError: dndConfigurationError,
    } = useDoNotDisturbConfigurationQuery();

    const [editConfig, setEditConfig] = React.useState<null | DoNotDisturbConfiguration>(null);
    React.useEffect(() => {
        if (dndConfiguration) {
            setEditConfig(deepCopy(dndConfiguration));
        }
    }, [dndConfiguration]);

    const {
        mutate: updateDndConfiguration,
        isPending: dndConfigurationUpdating
    } = useDoNotDisturbConfigurationMutation();

    const startTimeValue = React.useMemo(() => {
        const date = new Date();
        date.setUTCHours(editConfig?.start.hour ?? 0, editConfig?.start.minute ?? 0, 0, 0);
        return date;
    }, [editConfig]);

    const endTimeValue = React.useMemo(() => {
        const date = new Date();
        date.setUTCHours(editConfig?.end.hour ?? 0, editConfig?.end.minute ?? 0, 0, 0);
        return date;
    }, [editConfig]);

    const dndConfigurationContent = React.useMemo(() => {
        if (dndConfigurationError) {
            return (
                <Typography color="error">
                    Error loading DND configuration.
                </Typography>
            );
        }

        return (
            <>
                <FormControlLabel control={<Checkbox checked={editConfig?.enabled || false} onChange={(e) => {
                    if (editConfig) {
                        const newConfig = deepCopy(editConfig);
                        newConfig.enabled = e.target.checked;
                        setEditConfig(newConfig);
                    }
                }}/>} label="Enabled"/>
                <Stack direction="row" spacing={1} sx={{mt: 1, mb: 1}}>
                    <TimePicker
                        label="Start time"
                        value={startTimeValue}
                        ampm={false}
                        disabled={!editConfig?.enabled || false}
                        onChange={(newValue : Date | null) => {
                            if (editConfig && newValue) {
                                const date = new Date(newValue);
                                const newConfig = deepCopy(editConfig);
                                newConfig.start.hour = date.getUTCHours();
                                newConfig.start.minute = date.getUTCMinutes();
                                setEditConfig(newConfig);
                            }
                        }}
                    />
                    <TimePicker
                        label="End time"
                        value={endTimeValue}
                        ampm={false}
                        disabled={!editConfig?.enabled || false}
                        onChange={(newValue: Date | null) => {
                            if (editConfig && newValue) {
                                const date = new Date(newValue);
                                const newConfig = deepCopy(editConfig);
                                newConfig.end.hour = date.getUTCHours();
                                newConfig.end.minute = date.getUTCMinutes();
                                setEditConfig(newConfig);
                            }
                        }}
                    />
                </Stack>
                <Typography variant="subtitle2" color="textSecondary" sx={{mb: 2}}>
                    UTC: {formatTime(editConfig?.start)} &mdash; {formatTime(editConfig?.end)}
                </Typography>
                <LoadingButton loading={dndConfigurationUpdating} variant="outlined" color="success" onClick={() => {
                    if (editConfig) {
                        updateDndConfiguration(editConfig);
                    }
                }}>Apply</LoadingButton>
            </>
        );
    }, [editConfig, startTimeValue, endTimeValue, dndConfigurationError, dndConfigurationUpdating, updateDndConfiguration]);


    const loading = dndConfigurationUpdating || dndConfigurationFetching || !dndConfiguration;
    return (
        <CapabilityItem
            title={"Do not disturb"}
            loading={loading}
            helpText={DoNotDisturbHelp}
        >
            {dndConfigurationContent}
        </CapabilityItem>
    );
};

const DoNotDisturb: FunctionComponent = () => {
    const [doNotDisturb] = useCapabilitiesSupported(Capability.DoNotDisturb);
    if (!doNotDisturb) {
        return null;
    }

    return <DoNotDisturbControl/>;
};

export default DoNotDisturb;
