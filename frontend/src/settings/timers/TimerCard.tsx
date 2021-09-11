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
} from "@material-ui/core";
import { Delete as DeleteIcon, Edit as EditIcon } from "@material-ui/icons";
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
    zone_cleanup: "Zone cleanup",
    segment_cleanup: "Segment cleanup",
    goto_location: "Go to location",
};

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
        // Year 0 breaks everything
        const date = new Date(
            Date.UTC(2020, 0, 0, timer.hour, timer.minute, 0, 0)
        );
        return (
            <>
                <Typography
                    variant={"h4"}
                    component={"span"}
                    sx={{ marginRight: 2 }}
                >
                    {String(date.getHours()).padStart(2, "0")}:
                    {String(date.getMinutes()).padStart(2, "0")}
                </Typography>
                <Typography
                    variant={"h5"}
                    component={"span"}
                    color={"textSecondary"}
                >
                    {String(date.getUTCHours()).padStart(2, "0")}:
                    {String(date.getUTCMinutes()).padStart(2, "0")} UTC
                </Typography>
            </>
        );
    }, [timer]);

    const actionLabel = React.useMemo(() => {
        const label = timerActionLabels[timer.action.type];

        return <Typography variant={"subtitle1"}>{label}</Typography>;
    }, [timer]);

    return (
        <Card key={timer.id}>
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
