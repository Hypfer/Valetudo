import {
    Box,
    Button,
    Grid,
    Icon,
    Paper,
    styled,
    Typography,
} from "@mui/material";
import {
    BasicControlCommand,
    Capability,
    StatusState,
    useAutoEmptyDockManualTriggerMutation,
    useBasicControlMutation,
    useLocateMutation,
    useRobotStatusQuery,
} from "../api";
import {
    Home as HomeIcon,
    NotListedLocation as LocateIcon,
    Pause as PauseIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    RestoreFromTrash as EmptyIcon,
    SvgIconComponent,
} from "@mui/icons-material";
import { useCapabilitiesSupported } from "../CapabilitiesProvider";

const StyledIcon = styled(Icon)(({ theme }) => {
    return {
        marginRight: theme.spacing(1),
        marginLeft: -theme.spacing(1),
    };
});

const StartStates: StatusState["value"][] = ["idle", "docked", "paused", "error"];
const PauseStates: StatusState["value"][] = ["cleaning", "returning", "moving"];

interface CommandButton {
    command: BasicControlCommand | "locate" | "trigger_empty";
    enabled: boolean;
    label: string;
    Icon: SvgIconComponent;
}

const BasicControls = (): JSX.Element => {
    const { data: status } = useRobotStatusQuery();
    const {
        mutate: executeBasicControlCommand,
        isLoading: basicControlIsExecuting
    } = useBasicControlMutation();
    const [locateSupported] = useCapabilitiesSupported(Capability.Locate);
    const {
        mutate: locate,
        isLoading: locateIsExecuting
    } = useLocateMutation();
    const [triggerEmptySupported] = useCapabilitiesSupported(Capability.AutoEmptyDockManualTrigger);
    const {
        mutate: triggerDockEmpty,
        isLoading: emptyIsExecuting,
    } = useAutoEmptyDockManualTriggerMutation();

    const isLoading = basicControlIsExecuting || locateIsExecuting || emptyIsExecuting;

    const sendCommand = (command: BasicControlCommand | "locate" | "trigger_empty") => {
        return () => {
            switch (command) {
                case "locate":
                    locate();
                    break;
                case "trigger_empty":
                    triggerDockEmpty();
                    break;
                default:
                    executeBasicControlCommand(command);
            }
        };
    };

    if (status === undefined) {
        return (
            <Paper>
                <Box p={1}>
                    <Typography color="error">Error loading basic controls</Typography>
                </Box>
            </Paper>
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
            enabled: state === "idle" || state === "error",
            Icon: HomeIcon,
            label: "Dock",
        },
    ];

    if (locateSupported) {
        buttons.push({
            command: "locate",
            enabled: true,
            label: "Locate",
            Icon: LocateIcon,
        });
    }

    if (triggerEmptySupported) {
        buttons.push({
            command: "trigger_empty",
            enabled: state === "docked",
            label: "Empty",
            Icon: EmptyIcon,
        });
    }

    return (
        <Paper>
            <Box p={1}>
                <Grid container spacing={1} justifyContent="space-evenly">
                    {buttons.map(({ label, command, enabled, Icon }) => {
                        return (
                            <Grid item key={command}>
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    disabled={!enabled || isLoading}
                                    onClick={sendCommand(command)}
                                    color="inherit"
                                >
                                    <StyledIcon as={Icon} /> {label}
                                </Button>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        </Paper>
    );
};

export default BasicControls;
