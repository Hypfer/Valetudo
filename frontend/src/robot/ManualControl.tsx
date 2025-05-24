import React, {useEffect, useRef, useCallback} from "react";
import {
    Box,
    Button,
    FormControlLabel,
    Grid2,
    Stack,
    Switch,
    Typography,
    styled,
    Skeleton,
} from "@mui/material";
import {
    Capability,
    ManualControlCommand,
    useManualControlInteraction,
    useManualControlPropertiesQuery,
    useManualControlStateQuery,
    useHighResolutionManualControlStateQuery,
    useHighResolutionManualControlInteraction,
    ValetudoManualMovementVector,
} from "../api";
import { useCapabilitiesSupported } from "../CapabilitiesProvider";
import { FullHeightGrid } from "../components/FullHeightGrid";
import { useTheme } from "@mui/material/styles";
import {
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
    RotateLeft as RotateLeftIcon,
    RotateRight as RotateRightIcon,
} from "@mui/icons-material";
import PaperContainer from "../components/PaperContainer";
import { Joystick } from "react-joystick-component";
import { IJoystickUpdateEvent } from "react-joystick-component/build/lib/Joystick";

const SideButton = styled(Button)({
    width: "30%",
    height: "100%",
});

const CenterButton = styled(Button)({
    width: "100%",
});

const ControlToggle = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useManualControlStateQuery();
    const {mutate: sendInteraction, isPending: toggleInteracting} = useManualControlInteraction();

    return (
        <FormControlLabel
            control={
                <Switch
                    checked={manualControlState?.enabled || false}
                    disabled={manualControlStatePending || toggleInteracting}
                    onChange={(e) => {
                        sendInteraction({
                            action: e.target.checked ? "enable" : "disable"
                        });
                    }}
                />
            }
            label="Enable manual control"
            style={{marginLeft:0}}
        />
    );
};

const MovementControls = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useManualControlStateQuery();

    const {
        data: manualControlProperties,
        isPending: manualControlPropertiesPending,
    } = useManualControlPropertiesQuery();

    const {mutate: sendInteraction, isPending: moveInteracting} = useManualControlInteraction();

    const loading = manualControlStatePending || manualControlPropertiesPending;
    const controlsEnabled = !loading && manualControlState?.enabled && !moveInteracting;

    const forwardEnabled = controlsEnabled && manualControlProperties?.supportedMovementCommands.includes("forward");
    const backwardEnabled = controlsEnabled && manualControlProperties?.supportedMovementCommands.includes("backward");
    const rotateCwEnabled = controlsEnabled && manualControlProperties?.supportedMovementCommands.includes("rotate_clockwise");
    const rotateCcwEnabled = controlsEnabled && manualControlProperties?.supportedMovementCommands.includes("rotate_counterclockwise");

    const sendMoveCommand = (command: ManualControlCommand) => {
        sendInteraction({
            action: "move",
            movementCommand: command,
        });
    };

    return (
        <Stack direction="row" sx={{width: "100%", height: "30vh"}} justifyContent="center" alignItems="center">
            <SideButton variant="outlined" disabled={!rotateCcwEnabled}
                onClick={() => {
                    sendMoveCommand("rotate_counterclockwise");
                }}>
                <RotateLeftIcon/>
            </SideButton>
            <Stack sx={{width: "40%", height: "100%", ml: 1, mr: 1}} justifyContent="space-between">
                <CenterButton sx={{height: "65%"}} variant="outlined" disabled={!forwardEnabled}
                    onClick={() => {
                        sendMoveCommand("forward");
                    }}>
                    <ArrowUpwardIcon/>
                </CenterButton>
                <CenterButton sx={{height: "30%"}} variant="outlined" disabled={!backwardEnabled}
                    onClick={() => {
                        sendMoveCommand("backward");
                    }}>
                    <ArrowDownwardIcon/>
                </CenterButton>
            </Stack>
            <SideButton variant="outlined" disabled={!rotateCwEnabled}
                onClick={() => {
                    sendMoveCommand("rotate_clockwise");
                }}>
                <RotateRightIcon/>
            </SideButton>
        </Stack>
    );
};

const ManualControlInternal: React.FunctionComponent = (): React.ReactElement => {
    const { isPending: stateLoading, isError: stateError } = useManualControlStateQuery();
    const { isPending: propertiesLoading, isError: propertiesError } = useManualControlPropertiesQuery();

    const loading = stateLoading || propertiesLoading;
    const hasError = stateError || propertiesError;

    return (
        <FullHeightGrid container direction="column">
            <Grid2 flexGrow={1}>
                <Box>
                    {
                        loading ?
                            (
                                <Skeleton height={"12rem"}/>
                            ) : (
                                <>
                                    { hasError && <Typography color="error">Error loading manual controls</Typography> }
                                    <ControlToggle />
                                    <Box />
                                    <MovementControls />
                                </>
                            )
                    }
                </Box>
            </Grid2>
        </FullHeightGrid>
    );
};

const HighResolutionControlToggle = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useHighResolutionManualControlStateQuery();
    const {mutate: sendInteraction, isPending: toggleInteracting} = useHighResolutionManualControlInteraction();

    return (
        <FormControlLabel
            control={
                <Switch
                    checked={manualControlState?.enabled || false}
                    disabled={manualControlStatePending || toggleInteracting}
                    onChange={(e) => {
                        sendInteraction({
                            action: e.target.checked ? "enable" : "disable"
                        });
                    }}
                />
            }
            label="Enable manual control"
            style={{marginLeft:0}}
        />
    );
};

const HighResolutionMovementControls = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useHighResolutionManualControlStateQuery();
    const { mutate: sendInteraction } = useHighResolutionManualControlInteraction();

    const controlsEnabled = (!manualControlStatePending && manualControlState?.enabled);
    const theme = useTheme();

    const velocityRef = useRef(0);
    const angleRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const sendMoveCommand = useCallback((vector: ValetudoManualMovementVector) => {
        sendInteraction({
            action: "move",
            vector: vector,
        });
    }, [sendInteraction]);

    const handleInputStateUpdate = useCallback((type: "move" | "stop" | "start") => {
        if (type === "stop") {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            sendMoveCommand({ velocity: 0, angle: 0 });
        } else if (type === "move") {
            if (!intervalRef.current) {
                sendMoveCommand({ velocity: velocityRef.current, angle: angleRef.current });

                intervalRef.current = setInterval(() => {
                    sendMoveCommand({ velocity: velocityRef.current, angle: angleRef.current });
                }, 250);
            }
        }
    }, [sendMoveCommand]);

    const handleJoystickInput = useCallback((e: IJoystickUpdateEvent) => {
        let eventVelocity = 0;
        let eventAngle = 0;

        if (e.type === "move") {
            eventVelocity = (e.y ?? 0);
            eventAngle = (e.x ?? 0) * 120; // 180 would be the limit, but 120 is far saner 
        }

        velocityRef.current = eventVelocity;
        angleRef.current = eventAngle;

        handleInputStateUpdate(e.type);
    }, [handleInputStateUpdate]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);

                intervalRef.current = null;
            }
        };
    }, []);


    const baseColor = controlsEnabled ? theme.palette.grey[600] : theme.palette.grey[800];
    const stickColor = controlsEnabled ? theme.palette.primary.main : theme.palette.grey[600];

    return (
        <Box sx={{ mt: 12, mb: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Joystick
                size={200}
                move={handleJoystickInput}
                stop={handleJoystickInput}
                disabled={!controlsEnabled}
                throttle={100}
                baseColor={baseColor}
                stickColor={stickColor}
            />
        </Box>
    );
};


const HighResolutionManualControlInternal: React.FunctionComponent = (): React.ReactElement => {
    const { isPending: stateLoading, isError: stateError } = useHighResolutionManualControlStateQuery();

    return (
        <FullHeightGrid container direction="column">
            <Grid2 flexGrow={1}>
                <Box>
                    {
                        stateLoading ? (
                            <Skeleton height={"12rem"}/>
                        ) : (
                            <>
                                { stateError && <Typography color="error">Error loading manual controls</Typography> }
                                <HighResolutionControlToggle />
                                <Box />
                                <HighResolutionMovementControls />
                            </>
                        )
                    }
                </Box>
            </Grid2>
        </FullHeightGrid>
    );
};


const ManualControl = (): React.ReactElement => {
    const [highResSupported, standardSupported] = useCapabilitiesSupported(
        Capability.HighResolutionManualControl,
        Capability.ManualControl
    );

    let controlComponent;
    if (highResSupported) {
        controlComponent = <HighResolutionManualControlInternal />;
    } else if (standardSupported) {
        controlComponent = <ManualControlInternal />;
    } else {
        controlComponent = <Typography color="error">This robot does not support manual control.</Typography>;
    }

    return (
        <PaperContainer>
            {controlComponent}
        </PaperContainer>
    );
};

export default ManualControl;
