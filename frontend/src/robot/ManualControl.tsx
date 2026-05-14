import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    FormControlLabel,
    Grid2,
    Skeleton,
    Switch,
    Typography,
} from "@mui/material";
import {
    Capability,
    ManualControlCommand,
    sendManualControlInteraction,
    sendHighResolutionManualControlInteraction,
    useManualControlInteraction,
    useManualControlPropertiesQuery,
    useManualControlStateQuery,
    useHighResolutionManualControlStateQuery,
    useHighResolutionManualControlInteraction,
    ValetudoManualMovementVector,
    ManualControlInteraction,
    HighResolutionManualControlInteraction,
} from "../api";
import { useCapabilitiesSupported } from "../CapabilitiesProvider";
import { FullHeightGrid } from "../components/FullHeightGrid";
import PaperContainer from "../components/PaperContainer";
import { VirtualControllerProvider, InputMode, MovementCommandSender, useVirtualController } from "./manual_control/VirtualController";
import { MovementSampler } from "./manual_control/MovementSampler";
import { InputModeToggle } from "./manual_control/InputModeToggle";
import { KeyboardInput } from "./manual_control/KeyboardInput";
import { DPadInput } from "./manual_control/DPadInput";
import { ControllerVisual } from "./manual_control/ControllerVisual";

function ModeSwitchReset({ mode }: { mode: InputMode }) {
    const { resetState } = useVirtualController();
    const prevMode = useRef(mode);
    useEffect(() => {
        if (prevMode.current !== mode) {
            prevMode.current = mode;
            resetState();
        }
    }, [mode, resetState]);
    return null;
}

const HighResolutionControlToggle = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useHighResolutionManualControlStateQuery();
    const { mutate: sendInteraction, isPending: toggleInteracting } = useHighResolutionManualControlInteraction();

    return (
        <FormControlLabel
            control={
                <Switch
                    checked={manualControlState?.enabled || false}
                    disabled={manualControlStatePending || toggleInteracting}
                    onChange={(e) => {
                        sendInteraction({
                            action: e.target.checked ? "enable" : "disable",
                        });
                    }}
                />
            }
            label="Enable manual control"
            style={{ marginLeft: 0 }}
        />
    );
};

const StandardControlToggle = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useManualControlStateQuery();
    const { mutate: sendInteraction, isPending: toggleInteracting } = useManualControlInteraction();

    return (
        <FormControlLabel
            control={
                <Switch
                    checked={manualControlState?.enabled || false}
                    disabled={manualControlStatePending || toggleInteracting}
                    onChange={(e) => {
                        sendInteraction({
                            action: e.target.checked ? "enable" : "disable",
                        });
                    }}
                />
            }
            label="Enable manual control"
            style={{ marginLeft: 0 }}
        />
    );
};

const HighResolutionMovementControls = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useHighResolutionManualControlStateQuery();

    const controlsEnabled = !manualControlStatePending && !!manualControlState?.enabled;
    const [inputMode, setInputMode] = useState<InputMode>("joystick");

    const controllerSender: MovementCommandSender = useCallback(async (vector) => {
        await sendHighResolutionManualControlInteraction({
            action: "move",
            vector: vector,
        } as HighResolutionManualControlInteraction);
    }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <InputModeToggle mode={inputMode} onChange={setInputMode} />

            <VirtualControllerProvider>
                <Box sx={{ minHeight: 240, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <MovementSampler enabled={controlsEnabled} sendMoveCommand={controllerSender} />
                    <ModeSwitchReset mode={inputMode} />
                    <ControllerVisual mode={inputMode} enabled={controlsEnabled} />

                    {inputMode === "keyboard" && (
                        <KeyboardInput enabled={controlsEnabled} highResSupported={true} />
                    )}
                    {inputMode === "dpad" && <DPadInput enabled={controlsEnabled} />}
                </Box>
            </VirtualControllerProvider>
        </Box>
    );
};

const StandardMovementControls = () => {
    const {
        data: manualControlState,
        isPending: manualControlStatePending,
    } = useManualControlStateQuery();
    const {
        data: manualControlProperties,
        isPending: manualControlPropertiesPending,
    } = useManualControlPropertiesQuery();

    const loading = manualControlStatePending || manualControlPropertiesPending;
    const controlsEnabled = !loading && !!manualControlState?.enabled;
    const [inputMode, setInputMode] = useState<InputMode>("dpad");

    const forwardSupported = manualControlProperties?.supportedMovementCommands.includes("forward") ?? false;
    const backwardSupported = manualControlProperties?.supportedMovementCommands.includes("backward") ?? false;
    const rotateCwSupported = manualControlProperties?.supportedMovementCommands.includes("rotate_clockwise") ?? false;
    const rotateCcwSupported = manualControlProperties?.supportedMovementCommands.includes("rotate_counterclockwise") ?? false;

    const sendMoveCommand = useCallback(async (vector: ValetudoManualMovementVector) => {
        if (vector.velocity > 0.3 && forwardSupported) {
            await sendManualControlInteraction({ action: "move", movementCommand: "forward" as ManualControlCommand } as ManualControlInteraction);
        } else if (vector.velocity < -0.3 && backwardSupported) {
            await sendManualControlInteraction({ action: "move", movementCommand: "backward" as ManualControlCommand } as ManualControlInteraction);
        } else if (vector.angle > 30 && rotateCwSupported) {
            await sendManualControlInteraction({ action: "move", movementCommand: "rotate_clockwise" as ManualControlCommand } as ManualControlInteraction);
        } else if (vector.angle < -30 && rotateCcwSupported) {
            await sendManualControlInteraction({ action: "move", movementCommand: "rotate_counterclockwise" as ManualControlCommand } as ManualControlInteraction);
        }
    }, [forwardSupported, backwardSupported, rotateCwSupported, rotateCcwSupported]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <InputModeToggle
                mode={inputMode}
                onChange={setInputMode}
            />

            <VirtualControllerProvider>
                <Box sx={{ minHeight: 240, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <MovementSampler enabled={controlsEnabled} sendMoveCommand={sendMoveCommand} />
                    <ModeSwitchReset mode={inputMode} />
                    <ControllerVisual mode={inputMode} enabled={controlsEnabled} />

                    {inputMode === "keyboard" && (
                        <KeyboardInput enabled={controlsEnabled} highResSupported={false} />
                    )}
                    {inputMode === "dpad" && <DPadInput enabled={controlsEnabled} />}
                </Box>
            </VirtualControllerProvider>
        </Box>
    );
};

const HighResolutionManualControlInternal: React.FunctionComponent = (): React.ReactElement => {
    const { isPending: stateLoading, isError: stateError } = useHighResolutionManualControlStateQuery();

    return (
        <FullHeightGrid container direction="column">
            <Grid2 flexGrow={1}>
                <Box>
                    {stateLoading ? (
                        <Skeleton height={"12rem"} />
                    ) : (
                        <>
                            {stateError && <Typography color="error">Error loading manual controls</Typography>}
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                                <HighResolutionControlToggle />
                            </Box>
                            <HighResolutionMovementControls />
                        </>
                    )}
                </Box>
            </Grid2>
        </FullHeightGrid>
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
                    {loading ? (
                        <Skeleton height={"12rem"} />
                    ) : (
                        <>
                            {hasError && <Typography color="error">Error loading manual controls</Typography>}
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                                <StandardControlToggle />
                            </Box>
                            <StandardMovementControls />
                        </>
                    )}
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
        <PaperContainer paperStyle={{ userSelect: "none" } as React.CSSProperties}>
            {controlComponent}
        </PaperContainer>
    );
};

export default ManualControl;
