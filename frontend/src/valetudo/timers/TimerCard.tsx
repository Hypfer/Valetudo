import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid2,
    IconButton,
    Typography,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, PlayArrow as ExecNowIcon } from "@mui/icons-material";
import React, { FunctionComponent } from "react";
import {Timer, TimerProperties, ValetudoTimerActionType} from "../../api";
import TimerEditDialog from "./TimerEditDialog";
import {convertTimer} from "./TimerUtils";

export const weekdays = [
    {
        label: "Monday",
        dow: 1
    },
    {
        label: "Tuesday",
        dow: 2
    },
    {
        label: "Wednesday",
        dow: 3
    },
    {
        label: "Thursday",
        dow: 4
    },
    {
        label: "Friday",
        dow: 5
    },
    {
        label: "Saturday",
        dow: 6
    },
    {
        label: "Sunday",
        dow: 0
    },
];

type TimerCardProps = {
    timer: Timer;
    timerProperties: TimerProperties;
    onSave: (newProps: Timer) => void;
    onDelete: () => void;
    onExecNow: () => void;
};

export const timerActionLabels: Record<ValetudoTimerActionType, string> = {
    [ValetudoTimerActionType.FULL_CLEANUP]: "Full cleanup",
    [ValetudoTimerActionType.SEGMENT_CLEANUP]: "Segment cleanup",
};

const TimerCard: FunctionComponent<TimerCardProps> = ({
    timer,
    timerProperties,
    onSave,
    onDelete,
    onExecNow
}): React.ReactElement => {
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [execNowDialogOpen, setExecNowDialogOpen] = React.useState(false);
    const timerInLocalTime = React.useMemo(() => {
        return convertTimer(timer, new Date().getTimezoneOffset() * -1);
    }, [timer]);

    const weekdayLabels = React.useMemo(() => {
        return (
            <Grid2
                container
                direction="row"
                sx={{
                    justifyContent: "space-between"
                }}
            >
                {weekdays.map((day, i) => {
                    const enabled = timerInLocalTime.dow.includes(day.dow);

                    return (
                        <Grid2
                            key={day.label}
                        >
                            <Typography
                                variant={"body2"}
                                color={enabled ? "textPrimary" : "textSecondary"}
                                component={"span"}
                                sx={i < weekdays.length - 1 ? { marginRight: 1 } : {}}
                            >
                                {day.label.toUpperCase().slice(0, 3)}
                            </Typography>
                        </Grid2>
                    );
                })}
            </Grid2>
        );
    }, [timerInLocalTime]);

    const timeLabel = React.useMemo(() => {
        return (
            <>
                <Typography
                    variant={"h4"}
                    component={"span"}
                    sx={{ marginRight: 2 }}
                >
                    {timerInLocalTime.hour.toString().padStart(2, "0")}:
                    {timerInLocalTime.minute.toString().padStart(2, "0")}
                </Typography>
                <Typography
                    variant={"h5"}
                    component={"span"}
                    color={"textSecondary"}
                >
                    {timer.hour.toString().padStart(2, "0")}:
                    {timer.minute.toString().padStart(2, "0")} UTC
                </Typography>
            </>
        );
    }, [timerInLocalTime, timer]);

    const actionLabel = React.useMemo(() => {
        const label = timerActionLabels[timer.action.type];

        return <Typography variant={"subtitle1"}>{label}</Typography>;
    }, [timer]);

    const preActionLabel = React.useMemo(() => {
        if (timer?.pre_actions?.length) {
            return <Typography variant={"subtitle1"}>
                {`${timer.pre_actions.length} Pre-Action${timer.pre_actions.length > 1 ? "s" : ""}`}
            </Typography>;
        } else {
            return null;
        }
    }, [timer]);

    const timerLabel = React.useMemo(() => {
        return timer?.label || "Timer";
    }, [timer]);

    const dialogTimerText = React.useMemo(() => {
        if (timer?.label) {
            return `"${timer.label}"`;
        } else {
            return "this timer";
        }

    }, [timer]);

    return (
        <Card
            key={timer.id}
            sx={{boxShadow: 3}}
        >
            <CardContent>
                <Grid2
                    container
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{minWidth: "16rem"}}
                >
                    <Grid2>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={timer.enabled}
                                    disabled={true}
                                />
                            }
                            disableTypography
                            label={
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ marginBottom: 0, userSelect: "none" }}
                                    title={timer.id}
                                >
                                    {timerLabel}
                                </Typography>
                            }
                        />
                    </Grid2>
                    <Grid2>
                        <IconButton
                            onClick={() => {
                                setDeleteDialogOpen(true);
                            }}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                setEditDialogOpen(true);
                            }}
                            color="warning"
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                setExecNowDialogOpen(true);
                            }}
                            color="success"
                        >
                            <ExecNowIcon />
                        </IconButton>
                    </Grid2>
                </Grid2>

                <Divider />
                {weekdayLabels}

                <Box pt={1} />

                {timeLabel}

                {actionLabel}

                {preActionLabel}

                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                    }}
                >
                    <DialogTitle>Delete timer?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Do you really want to delete {dialogTimerText}?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setDeleteDialogOpen(false);
                            }}
                        >
                            No
                        </Button>
                        <Button
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                onDelete();
                            }}
                            autoFocus
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Dialog>

                {
                    editDialogOpen &&
                    <TimerEditDialog
                        timerInLocalTime={timerInLocalTime}
                        onCancel={() => {
                            setEditDialogOpen(false);
                        }}
                        onSave={(timer) => {
                            setEditDialogOpen(false);
                            onSave(timer);
                        }}
                        timerProperties={timerProperties}
                    />
                }

                <Dialog
                    open={execNowDialogOpen}
                    onClose={() => {
                        setExecNowDialogOpen(false);
                    }}
                >
                    <DialogTitle>Execute timer?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Do you really want to execute {dialogTimerText} right now?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setExecNowDialogOpen(false);
                            }}
                        >
                            No
                        </Button>
                        <Button
                            onClick={() => {
                                setExecNowDialogOpen(false);
                                onExecNow();
                            }}
                            autoFocus
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Dialog>

            </CardContent>
        </Card>
    );
};

export default TimerCard;
