import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useRef } from "react";
import { useVirtualController } from "./VirtualController";
import { useKonamiCode } from "./useKonamiCode";

interface KeyboardInputProps {
    enabled: boolean;
    highResSupported: boolean;
}

export function KeyboardInput({ enabled, highResSupported }: KeyboardInputProps) {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const handleKonamiUnlock = useCallback(() => {
        enqueueSnackbar("I found an easter egg and all I got was this lousy notification.", {
            variant: "success",
            persist: true,
            key: "konami",
            preventDuplicate: true,
            style: { userSelect: "none" },
            action: (key) => (
                <IconButton size="small" onClick={() => closeSnackbar(key)}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            ),
        });
    }, [enqueueSnackbar, closeSnackbar]);

    useKonamiCode(handleKonamiUnlock);
    const { updateState, resetState } = useVirtualController();
    const pressedKeys = useRef(new Set<string>());

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const computeState = () => {
            const keys = pressedKeys.current;
            let axisY = 0;
            let axisX = 0;

            if (keys.has("w")) {
                axisY += 1;
            }
            if (keys.has("s")) {
                axisY -= 1;
            }
            if (keys.has("a")) {
                axisX -= 1;
            }
            if (keys.has("d")) {
                axisX += 1;
            }

            if (highResSupported) {
                if (axisY !== 0 || axisX !== 0) {
                    const dist = Math.sqrt(axisX * axisX + axisY * axisY);
                    const normalizedX = axisX / dist;
                    const normalizedY = axisY / dist;
                    const velocity = normalizedY;
                    const angle = normalizedX * 120;
                    updateState({ velocity: velocity, angle: angle });
                } else {
                    resetState();
                }
            } else {
                if (axisY > 0) {
                    updateState({ velocity: 1, angle: 0 });
                } else if (axisY < 0) {
                    updateState({ velocity: -1, angle: 0 });
                } else if (axisX < 0) {
                    updateState({ velocity: 0, angle: -120 });
                } else if (axisX > 0) {
                    updateState({ velocity: 0, angle: 120 });
                } else {
                    resetState();
                }
            }
        };

        const keyMap: Record<string, string> = {
            arrowup: "w",
            arrowdown: "s",
            arrowleft: "a",
            arrowright: "d",
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement) {
                return;
            }
            let key = event.key.toLowerCase();
            if (keyMap[key]) {
                key = keyMap[key];
            }
            if (!["w", "a", "s", "d"].includes(key)) {
                return;
            }
            if (pressedKeys.current.has(key)) {
                return;
            }

            event.preventDefault();
            pressedKeys.current.add(key);
            computeState();
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement) {
                return;
            }
            let key = event.key.toLowerCase();
            if (keyMap[key]) {
                key = keyMap[key];
            }
            if (!["w", "a", "s", "d"].includes(key)) {
                return;
            }

            event.preventDefault();
            pressedKeys.current.delete(key);
            computeState();
        };

        const handleBlur = () => {
            pressedKeys.current.clear();
            resetState();
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        const keysRef = pressedKeys;
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
            keysRef.current.clear();
        };
    }, [enabled, highResSupported, updateState, resetState]);

    return null;
}
