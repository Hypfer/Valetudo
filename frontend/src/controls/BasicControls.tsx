import {
    Box,
    Button,
    ButtonGroup,
    DialogContentText,
    Grid,
    Paper,
    Typography,
} from "@mui/material";
import {
    BasicControlCommand,
    StatusState,
    useBasicControlMutation,
    useRobotStatusQuery,
} from "../api";
import {
    Home as HomeIcon,
    Pause as PauseIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    SvgIconComponent,
} from "@mui/icons-material";
import React from "react";
import LoadingFade from "../components/LoadingFade";
import ConfirmationDialog from "../components/ConfirmationDialog";
import {usePendingMapAction} from "../map/Map";

const StartStates: StatusState["value"][] = ["idle", "docked", "paused", "error"];
const PauseStates: StatusState["value"][] = ["cleaning", "returning", "moving"];

interface CommandButton {
    command: BasicControlCommand;
    enabled: boolean;
    label: string;
    Icon: SvgIconComponent;
}

const BasicControls = (): JSX.Element => {
    const [startConfirmationDialogOpen, setStartConfirmationDialogOpen] = React.useState(false);
    const { data: status, isLoading: statusLoading } = useRobotStatusQuery();
    const {
        mutate: executeBasicControlCommand,
        isLoading: basicControlIsExecuting
    } = useBasicControlMutation();

    const {
        hasPendingMapAction: hasPendingMapAction
    } = usePendingMapAction();

    const isLoading = basicControlIsExecuting;

    const sendCommand = (command: BasicControlCommand) => {
        if (command === "start" && hasPendingMapAction) {
            setStartConfirmationDialogOpen(true);
        } else {
            executeBasicControlCommand(command);
        }
    };

    if (statusLoading) {
        return (
            <Grid item>
                <Paper>
                    <Box p={1}>
                        <LoadingFade/>
                    </Box>
                </Paper>
            </Grid>
        );
    }

    if (status === undefined) {
        return (
            <Grid item>
                <Paper>
                    <Box p={1}>
                        <Typography color="error">Error loading basic controls</Typography>
                    </Box>
                </Paper>
            </Grid>
        );
    }

    const { flag, value: state } = status;

    const buttons: CommandButton[] = [
        {
            command: "start",
            enabled: StartStates.includes(state),
            label: flag === "resumable" ? "Resume" : "Start",
            Icon: StartIcon,
        },
        {
            command: "pause",
            enabled: PauseStates.includes(state),
            Icon: PauseIcon,
            label: "Pause",
        },
        {
            command: "stop",
            enabled: flag === "resumable" || (state !== "idle" && state !== "docked"),
            Icon: StopIcon,
            label: "Stop",
        },
        {
            command: "home",
            enabled: state === "idle" || state === "error" || state === "paused",
            Icon: HomeIcon,
            label: "Dock",
        },
    ];

    return (
        <>
            <Grid item>
                <Paper>
                    <Box p={1}>
                        <Grid item container direction="column">
                            <Grid item>
                                <ButtonGroup
                                    fullWidth
                                    variant="outlined"
                                >
                                    {buttons.map(({ label, command, enabled, Icon }) => {
                                        return (

                                            <Button
                                                key={command}
                                                variant="outlined"
                                                size="medium"
                                                disabled={!enabled || isLoading}
                                                onClick={() => {
                                                    sendCommand(command);
                                                }}
                                                color="inherit"
                                                style={{height: "3.5em", borderColor: "inherit"}}
                                            >
                                                <Icon />
                                            </Button>
                                        );
                                    })}
                                </ButtonGroup >
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Grid>

            <ConfirmationDialog
                title="Are you sure you want to start a full cleanup?"
                open={startConfirmationDialogOpen}
                onClose={() => {
                    setStartConfirmationDialogOpen(false);
                }}
                onAccept={() => {
                    executeBasicControlCommand("start");
                }}>
                <DialogContentText>
                    You currently have a pending MapAction.
                    <br/>
                    <br/>
                    <strong>Hint:</strong>
                    <br/>
                    You might instead be looking for the button on the bottom right of the map.
                </DialogContentText>
            </ConfirmationDialog>
        </>
    );
};

export default BasicControls;
