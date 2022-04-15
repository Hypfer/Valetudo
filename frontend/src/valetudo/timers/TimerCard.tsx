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
    Grid,
    IconButton,
    Typography,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import React, { FunctionComponent } from "react";
import { Timer, TimerProperties } from "../../api";
import TimerEditDialog from "./TimerEditDialog";

export const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

type TimerCardProps = {
    timer: Timer;
    timerProperties: TimerProperties;
    onSave: (newProps: Timer) => void;
    onDelete: () => void;
};

export const timerActionLabels: Record<string, string> = {
    full_cleanup: "Full cleanup",
    segment_cleanup: "Segment cleanup",
};

function convertTime(hour: number, minute: number, offset: number) : { hour: number, minute: number } {
    const dayInMinutes = 24*60;

    const inMidnightOffset = hour * 60 + minute;
    let outMidnightOffset = inMidnightOffset + offset;

    if (outMidnightOffset < 0) {
        outMidnightOffset += dayInMinutes;
    } else if (outMidnightOffset > dayInMinutes) {
        outMidnightOffset -= dayInMinutes;
    }

    return {
        hour: outMidnightOffset/60 |0,
        minute: outMidnightOffset%60
    };
}

const TimerCard: FunctionComponent<TimerCardProps> = ({
    timer,
    timerProperties,
    onSave,
    onDelete,
}): JSX.Element => {
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);

    const weekdayLabels = React.useMemo(() => {
        return weekdays.map((day, i) => {
            const enabled = timer.dow.includes(i);

            return (
                <Typography
                    key={day}
                    variant={"body2"}
                    color={enabled ? "textPrimary" : "textSecondary"}
                    component={"span"}
                    sx={i < weekdays.length - 1 ? { marginRight: 1 } : {}}
                >
                    {day.toUpperCase().slice(0, 3)}
                </Typography>
            );
        });
    }, [timer]);

    const timeLabel = React.useMemo(() => {
        const timezoneOffset = new Date().getTimezoneOffset() * -1;
        const timerInLocalTime = convertTime(timer.hour, timer.minute, timezoneOffset);

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
    }, [timer]);

    const actionLabel = React.useMemo(() => {
        const label = timerActionLabels[timer.action.type];

        return <Typography variant={"subtitle1"}>{label}</Typography>;
    }, [timer]);

    return (
        <Card
            key={timer.id}
            sx={{boxShadow: 3}}
        >
            <CardContent>
                <Grid
                    container
                    spacing={4}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Grid item>
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
                                    sx={{ marginBottom: 0 }}
                                    title={timer.id}
                                >
                                    Timer
                                </Typography>
                            }
                        />
                    </Grid>
                    <Grid item>
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
                    </Grid>
                </Grid>

                <Divider />
                {weekdayLabels}

                <Box pt={1} />

                {timeLabel}

                {actionLabel}

                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                    }}
                >
                    <DialogTitle>Delete timer?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Do you really want to delete this timer?
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

                <TimerEditDialog
                    timer={timer}
                    open={editDialogOpen}
                    onCancel={() => {
                        setEditDialogOpen(false);
                    }}
                    onSave={(timer) => {
                        setEditDialogOpen(false);
                        onSave(timer);
                    }}
                    timerProperties={timerProperties}
                />
            </CardContent>
        </Card>
    );
};

export default TimerCard;
