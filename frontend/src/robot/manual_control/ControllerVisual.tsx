import React, { useCallback, useMemo } from "react";
import { Box, styled, useTheme } from "@mui/material";
import { Joystick } from "react-joystick-component";
import { IJoystickUpdateEvent } from "react-joystick-component/build/lib/Joystick";
import { useVirtualController, InputMode } from "./VirtualController";

interface JoystickInputProps {
    enabled: boolean;
}

function JoystickInput({ enabled }: JoystickInputProps) {
    const { updateState, resetState } = useVirtualController();
    const theme = useTheme();

    const handleJoystickInput = useCallback((e: IJoystickUpdateEvent) => {
        if (e.type === "stop") {
            resetState();
        } else if (e.type === "move") {
            const velocity = e.y ?? 0;
            const angle = (e.x ?? 0) * 120; // 180 would be the limit, but 120 is far saner
            updateState({ velocity: velocity, angle: angle });
        }
    }, [resetState, updateState]);

    const baseColor = enabled ? (theme.palette.mode === "dark" ? theme.palette.grey[600] : theme.palette.grey[400]) : (theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[200]);
    const stickColor = enabled ? theme.palette.primary.main : (theme.palette.mode === "dark" ? theme.palette.grey[600] : theme.palette.grey[300]);

    return (
        <Joystick
            size={200}
            move={handleJoystickInput}
            stop={handleJoystickInput}
            disabled={!enabled}
            throttle={100}
            baseColor={baseColor}
            stickColor={stickColor}
        />
    );
}

const KeyCap = styled(Box, {
    shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ theme, active }) => ({
    width: 48,
    height: 48,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    userSelect: "none",
    backgroundColor: active ? theme.palette.primary.main : (theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[300]),
    color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
    border: `2px solid ${theme.palette.mode === "dark" ? theme.palette.grey[600] : theme.palette.grey[500]}`,
}));

interface KeyboardVisualProps {
    enabled: boolean;
}

function KeyboardVisual({ enabled }: KeyboardVisualProps) {
    const { state } = useVirtualController();

    const activeKeys = useMemo(() => {
        const keys: string[] = [];
        if (Math.abs(state.velocity) > 0.1) {
            keys.push(state.velocity > 0 ? "W" : "S");
        }
        if (Math.abs(state.angle) > 10) {
            keys.push(state.angle > 0 ? "D" : "A");
        }
        return keys;
    }, [state]);

    const keyActive = (key: string) => activeKeys.includes(key);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
            }}
        >
            <Box sx={{ display: "flex", gap: 1 }}>
                <KeyCap active={enabled && keyActive("W")}>
                    W
                </KeyCap>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
                <KeyCap active={enabled && keyActive("A")}>
                    A
                </KeyCap>
                <KeyCap active={enabled && keyActive("S")}>
                    S
                </KeyCap>
                <KeyCap active={enabled && keyActive("D")}>
                    D
                </KeyCap>
            </Box>
        </Box>
    );
}

interface ControllerVisualProps {
    mode: InputMode;
    enabled: boolean;
}

export function ControllerVisual({ mode, enabled }: ControllerVisualProps) {
    if (mode === "joystick") {
        return <JoystickInput enabled={enabled} />;
    }

    if (mode === "keyboard") {
        return <KeyboardVisual enabled={enabled} />;
    }

    return null;
}
