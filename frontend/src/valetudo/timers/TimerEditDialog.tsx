import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import React, { FunctionComponent } from "react";
import { Timer, TimerProperties } from "../../api";
import { deepCopy } from "../../utils";
import { timerActionLabels, weekdays } from "./TimerCard";
import { StaticTimePicker } from "@mui/lab";
import { TimerActionControlProps } from "./types";
import {
    FallbackControls,
    FullCleanupControls,
    SegmentCleanupControls,
    validateParams,
} from "./ActionControls";

const actionControls: Record<
    string,
    React.ComponentType<TimerActionControlProps>
> = {
    full_cleanup: FullCleanupControls,
    segment_cleanup: SegmentCleanupControls,
};

type TimerDialogProps = {
    timer: Timer;
    timerProperties: TimerProperties;
    open: boolean;
    onSave: (newProps: Timer) => void;
    onCancel: () => void;
};

const TimerEditDialog: FunctionComponent<TimerDialogProps> = ({
    timer,
    timerProperties,
    open,
    onSave,
    onCancel,
}): JSX.Element => {
    const theme = useTheme();
    const narrowScreen = useMediaQuery(theme.breakpoints.down("md"), {
        noSsr: true,
    });

    const [validAction, setValidAction] = React.useState(false);
    const [editTimer, setEditTimer] = React.useState<Timer>(timer);
    React.useEffect(() => {
        setEditTimer(timer);
    }, [timer]);

    React.useEffect(() => {
        if (validateParams[editTimer.action.type] !== undefined) {
            setValidAction(
                validateParams[editTimer.action.type](editTimer.action.params)
            );
        } else {
            setValidAction(false);
        }
    }, [editTimer, open]);

    const setActionParams = React.useCallback(
        (newParams: any) => {
            if (validateParams[editTimer.action.type] !== undefined) {
                setValidAction(validateParams[editTimer.action.type](newParams));
            } else {
                setValidAction(false);
            }

            const newTimer = deepCopy(editTimer);
            newTimer.action.params = newParams;

            setEditTimer(newTimer);
        },
        [editTimer]
    );

    const weekdayCheckboxes = React.useMemo(() => {
        const checkboxes = weekdays.map((weekday, i) => {
            if (!narrowScreen) {
                return (
                    <ToggleButton
                        disabled={!editTimer.enabled}
                        key={weekday}
                        value={i}
                        aria-label={weekday}
                    >
                        {weekday}
                    </ToggleButton>
                );
            } else {
                return (
                    <FormControlLabel
                        key={weekday}
                        control={
                            <Checkbox
                                checked={editTimer.dow.indexOf(i) !== -1}
                                disabled={!editTimer.enabled}
                                onChange={(e) => {
                                    const newTimer = deepCopy(editTimer);
                                    if (e.target.checked) {
                                        if (newTimer.dow.indexOf(i) === -1) {
                                            newTimer.dow.push(i);
                                        }
                                    } else {
                                        const idx = newTimer.dow.indexOf(i);
                                        if (idx !== -1) {
                                            newTimer.dow.splice(idx, 1);
                                        }
                                    }
                                    setEditTimer(newTimer);
                                }}
                            />
                        }
                        label={weekday}
                        aria-label={weekday}
                    />
                );
            }
        });

        if (!narrowScreen) {
            return (
                <ToggleButtonGroup
                    size={"small"}
                    orientation={"horizontal"}
                    value={editTimer.dow}
                    onChange={(_, newWeekdays) => {
                        if (!newWeekdays.length) {
                            return;
                        }
                        const newTimer = deepCopy(editTimer);
                        newTimer.dow = newWeekdays;
                        setEditTimer(newTimer);
                    }}
                >
                    {checkboxes}
                </ToggleButtonGroup>
            );
        }

        return checkboxes;
    }, [editTimer, narrowScreen]);

    const propertyMenuItems = React.useMemo(() => {
        return timerProperties.supportedActions.map((action) => {
            return (
                <MenuItem key={action} value={action}>
                    {timerActionLabels[action]}
                </MenuItem>
            );
        });
    }, [timerProperties]);

    const dateValue = React.useMemo(() => {
        const date = new Date();
        date.setUTCHours(editTimer.hour, editTimer.minute, 0, 0);
        return date;
    }, [editTimer]);

    const ActionControl = actionControls[editTimer.action.type] ?? FallbackControls;

    return (
        <Dialog open={open} maxWidth={"lg"} fullScreen={narrowScreen}>
            <DialogTitle>
                {editTimer.id === "" ? "Add timer" : "Edit timer"}
            </DialogTitle>
            <DialogContent>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={editTimer.enabled}
                            onChange={(e) => {
                                const newTimer = deepCopy(editTimer);
                                newTimer.enabled = e.target.checked;
                                setEditTimer(newTimer);
                            }}
                        />
                    }
                    label="Enabled"
                />

                <Box pt={1} />

                {weekdayCheckboxes}

                <Box pt={1} />

                <StaticTimePicker
                    ampm={false}
                    label={"Select time"}
                    orientation={narrowScreen ? "portrait" : "landscape"}
                    disabled={!editTimer.enabled}
                    value={dateValue}
                    onChange={(newValue) => {
                        if (newValue && editTimer.enabled) {
                            const newTimer = deepCopy(editTimer);
                            const date = new Date(newValue);
                            newTimer.hour = date.getUTCHours();
                            newTimer.minute = date.getUTCMinutes();
                            setEditTimer(newTimer);
                        }
                    }}
                    renderInput={(params) => {
                        return <TextField {...params} />;
                    }}
                />

                <Box pt={1} />

                <FormControl>
                    <InputLabel id={editTimer.id + "_label"}>Action</InputLabel>
                    <Select
                        labelId={editTimer.id + "_label"}
                        id={editTimer.id + "-action-select"}
                        value={editTimer.action.type}
                        label="Action"
                        disabled={!editTimer.enabled}
                        onChange={(e) => {
                            const newTimer = deepCopy(editTimer);
                            newTimer.action.type = e.target.value;
                            newTimer.action.params = {};
                            setEditTimer(newTimer);

                            if (validateParams[newTimer.action.type] !== undefined) {
                                setValidAction(
                                    validateParams[newTimer.action.type](
                                        newTimer.action.params
                                    )
                                );
                            } else {
                                setValidAction(false);
                            }
                        }}
                    >
                        {propertyMenuItems}
                    </Select>
                </FormControl>

                <Box pt={2} />

                <ActionControl
                    disabled={!editTimer.enabled}
                    params={editTimer.action.params}
                    setParams={setActionParams}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setEditTimer(timer);
                        onCancel();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        onSave(editTimer);
                    }}
                    disabled={!validAction}
                    autoFocus
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TimerEditDialog;
