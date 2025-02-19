import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    Grid2,
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
import {Timer, TimerProperties, ValetudoTimerActionType, ValetudoTimerPreActionType} from "../../api";
import { deepCopy } from "../../utils";
import { timerActionLabels, weekdays } from "./TimerCard";
import {TimerActionControlProps, TimerPreActionControlProps} from "./types";
import {
    ActionFallbackControls,
    FullCleanupActionControls,
    SegmentCleanupActionControls,
    validateParams,
} from "./ActionControls";
import {
    FanSpeedControlPreActionControl,
    OperationModeControlPreActionControl,
    WaterUsageControlPreActionControl
} from "./PreActionControls";
import {StaticTimePicker} from "@mui/x-date-pickers";

const actionControls: Record<
    ValetudoTimerActionType,
    React.ComponentType<TimerActionControlProps>
> = {
    [ValetudoTimerActionType.FULL_CLEANUP]: FullCleanupActionControls,
    [ValetudoTimerActionType.SEGMENT_CLEANUP]: SegmentCleanupActionControls,
};

const preActionControls: Record<
    ValetudoTimerPreActionType,
    React.ComponentType<TimerPreActionControlProps>
> = {
    [ValetudoTimerPreActionType.FAN_SPEED_CONTROL]: FanSpeedControlPreActionControl,
    [ValetudoTimerPreActionType.WATER_USAGE_CONTROL]: WaterUsageControlPreActionControl,
    [ValetudoTimerPreActionType.OPERATION_MODE_CONTROL]: OperationModeControlPreActionControl,
};

type TimerDialogProps = {
    timerInLocalTime: Timer;
    timerProperties: TimerProperties;
    onSave: (newProps: Timer) => void;
    onCancel: () => void;
};

const TimerEditDialog: FunctionComponent<TimerDialogProps> = ({
    timerInLocalTime,
    timerProperties,
    onSave,
    onCancel,
}): React.ReactElement => {
    const theme = useTheme();
    const narrowScreen = useMediaQuery(theme.breakpoints.down("md"), {
        noSsr: true,
    });

    const [validAction, setValidAction] = React.useState(false);
    const [editTimer, setEditTimer] = React.useState<Timer>(timerInLocalTime);
    React.useEffect(() => {
        setEditTimer(timerInLocalTime);
    }, [timerInLocalTime]);

    React.useEffect(() => {
        if (validateParams[editTimer.action.type] !== undefined) {
            setValidAction(
                validateParams[editTimer.action.type](editTimer.action.params)
            );
        } else {
            setValidAction(false);
        }
    }, [editTimer]);

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
        const checkboxes = weekdays.map((weekday) => {
            if (!narrowScreen) {
                return (
                    <ToggleButton
                        key={weekday.label}
                        value={weekday.dow}
                        aria-label={weekday.label}
                    >
                        {weekday.label}
                    </ToggleButton>
                );
            } else {
                return (
                    <FormControlLabel
                        key={weekday.label}
                        control={
                            <Checkbox
                                checked={editTimer.dow.indexOf(weekday.dow) !== -1}
                                onChange={(e) => {
                                    const newTimer = deepCopy(editTimer);
                                    if (e.target.checked) {
                                        if (newTimer.dow.indexOf(weekday.dow) === -1) {
                                            newTimer.dow.push(weekday.dow);
                                        }
                                    } else {
                                        const idx = newTimer.dow.indexOf(weekday.dow);
                                        if (idx !== -1) {
                                            newTimer.dow.splice(idx, 1);
                                        }
                                    }
                                    setEditTimer(newTimer);
                                }}
                            />
                        }
                        label={weekday.label}
                        aria-label={weekday.label}
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

    const actionMenuItems = React.useMemo(() => {
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
        date.setHours(editTimer.hour, editTimer.minute, 0, 0);
        return date;
    }, [editTimer]);

    const ActionControl = actionControls[editTimer.action.type] ?? ActionFallbackControls;
    const CurrentBrowserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <Dialog open={true} maxWidth={"lg"} fullScreen={narrowScreen}>
            <DialogTitle>
                {editTimer.id === "" ? "Add timer" : "Edit timer"}
            </DialogTitle>
            <DialogContent>
                <Divider textAlign="left" sx={{mb: 1}}>General</Divider>
                <Grid2
                    container
                    direction="column"
                >
                    <Grid2
                        sx={{paddingLeft: "0.5rem"}}
                    >
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
                    </Grid2>

                    <Grid2
                        sx={{paddingLeft: "0.5rem", marginTop: "0.5rem"}}
                    >
                        <TextField
                            label="Custom Label"
                            value={editTimer.label}
                            variant="standard"
                            onChange={e => {
                                const newTimer = deepCopy(editTimer);
                                newTimer.label = e.target.value.substring(0, 24);

                                if (newTimer.label.length === 0) {
                                    newTimer.label = undefined;
                                }

                                setEditTimer(newTimer);
                            }}
                        />
                    </Grid2>
                </Grid2>


                <Divider textAlign="left" sx={{mt: 1, mb: 1.5}}>Schedule</Divider>

                {weekdayCheckboxes}

                <Box pt={1.5} />

                <StaticTimePicker
                    ampm={false}
                    localeText={{toolbarTitle: `Select time (${CurrentBrowserTimezone})`}}
                    orientation={narrowScreen ? "portrait" : "landscape"}
                    value={dateValue}
                    onChange={(newValue: Date | null) => {
                        if (newValue) {
                            const newTimer = deepCopy(editTimer);
                            const date = new Date(newValue);

                            newTimer.hour = date.getHours();
                            newTimer.minute = date.getMinutes();

                            setEditTimer(newTimer);
                        }
                    }}
                />

                {
                    timerProperties.supportedPreActions.length > 0 &&
                    <>
                        <Divider textAlign="left" sx={{mt: 1, mb: 1.5}}>Pre-Actions</Divider>

                        {timerProperties.supportedPreActions.map(preActionType => {
                            const PreActionControl = preActionControls[preActionType];
                            const existingPreAction = editTimer.pre_actions?.find(action => action.type === preActionType);

                            return (
                                <PreActionControl
                                    key={preActionType}
                                    wasEnabled={existingPreAction !== undefined}
                                    params={existingPreAction?.params ?? {type: preActionType, params: {}}}
                                    setParams={(enabled, hasParams, params) => {
                                        editTimer.pre_actions = Array.isArray(editTimer.pre_actions) ? editTimer.pre_actions : [];
                                        editTimer.pre_actions = editTimer.pre_actions.filter(e => e.type !== preActionType);

                                        if (enabled && hasParams) {
                                            editTimer.pre_actions.push({
                                                type: preActionType,
                                                params: params
                                            });
                                        }
                                    }}
                                />
                            );
                        })}
                    </>
                }



                <Divider textAlign="left" sx={{mt: 1, mb: 1.5}}>Action</Divider>
                <FormControl>
                    <InputLabel id={editTimer.id + "_label"}>Action</InputLabel>
                    <Select
                        labelId={editTimer.id + "_label"}
                        id={editTimer.id + "-action-select"}
                        value={editTimer.action.type}
                        label="Action"
                        onChange={(e) => {
                            const newTimer = deepCopy(editTimer);
                            newTimer.action.type = e.target.value as ValetudoTimerActionType;
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
                        {actionMenuItems}
                    </Select>
                </FormControl>

                {
                    ActionControl &&
                    <div style={{marginLeft: "1rem", marginTop: "1.5rem"}}>
                        <ActionControl
                            params={editTimer.action.params}
                            disabled={false}
                            setParams={setActionParams}
                        />
                    </div>
                }

            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setEditTimer(timerInLocalTime);
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
