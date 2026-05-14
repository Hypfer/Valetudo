import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { InputMode } from "./VirtualController";

interface InputModeToggleProps {
    mode: InputMode;
    onChange: (mode: InputMode) => void;
}

export function InputModeToggle({ mode, onChange }: InputModeToggleProps) {
    const handleChange = (_: React.MouseEvent<HTMLElement>, newMode: InputMode | null) => {
        if (newMode) {
            onChange(newMode);
        }
    };

    return (
        <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleChange}
            size="small"
            sx={{ mb: 8 }}
        >
            <ToggleButton value="joystick">Joystick</ToggleButton>
            <ToggleButton value="dpad">D-Pad</ToggleButton>
            <ToggleButton value="keyboard">Keyboard</ToggleButton>
        </ToggleButtonGroup>
    );
}
