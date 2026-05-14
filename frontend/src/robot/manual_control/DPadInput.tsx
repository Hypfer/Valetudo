import React, { useCallback, useEffect, useRef } from "react";
import { Box, Button, styled } from "@mui/material";
import {
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
    RotateLeft as RotateLeftIcon,
    RotateRight as RotateRightIcon,
} from "@mui/icons-material";
import { useVirtualController } from "./VirtualController";

const DPadButton = styled(Button)(({ theme }) => ({
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    color: theme.palette.text.primary,
    "&:active": {
        backgroundColor: theme.palette.primary.main,
    },
}));

interface DPadInputProps {
    enabled: boolean;
}

export function DPadInput({ enabled }: DPadInputProps) {
    const { updateState, resetState } = useVirtualController();
    const isDragging = useRef(false);

    const startHold = useCallback((direction: string) => {
        if (!enabled) {
            return;
        }

        switch (direction) {
            case "forward":
                updateState({ velocity: 1, angle: 0 });
                break;
            case "backward":
                updateState({ velocity: -1, angle: 0 });
                break;
            case "rotate_left":
                updateState({ velocity: 0, angle: -120 });
                break;
            case "rotate_right":
                updateState({ velocity: 0, angle: 120 });
                break;
        }
    }, [enabled, updateState]);

    const stopHold = useCallback(() => {
        resetState();
    }, [resetState]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                stopHold();
            }
        };
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => {
            window.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [stopHold]);

    const handleMouseDown = useCallback((direction: string) => {
        isDragging.current = true;
        startHold(direction);
    }, [startHold]);

    const handleTouchStart = useCallback((e: React.TouchEvent, direction: string) => {
        e.preventDefault();
        startHold(direction);
    }, [startHold]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        stopHold();
    }, [stopHold]);

    const makeHandlers = (direction: string) => ({
        onMouseDown: () => handleMouseDown(direction),
        onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, direction),
        onTouchEnd: (e: React.TouchEvent) => handleTouchEnd(e),
        onTouchCancel: (e: React.TouchEvent) => handleTouchEnd(e),
    });

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                gap: 1,
                width: 200,
                height: 200,
            }}
        >
            <Box />
            <DPadButton
                variant="outlined"
                disabled={!enabled}
                {...makeHandlers("forward")}
            >
                <ArrowUpwardIcon />
            </DPadButton>
            <Box />

            <DPadButton
                variant="outlined"
                disabled={!enabled}
                {...makeHandlers("rotate_left")}
            >
                <RotateLeftIcon />
            </DPadButton>

            <Box />

            <DPadButton
                variant="outlined"
                disabled={!enabled}
                {...makeHandlers("rotate_right")}
            >
                <RotateRightIcon />
            </DPadButton>

            <Box />
            <DPadButton
                variant="outlined"
                disabled={!enabled}
                {...makeHandlers("backward")}
            >
                <ArrowDownwardIcon />
            </DPadButton>
            <Box />
        </Box>
    );
}
