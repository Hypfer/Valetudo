import React from "react";
import {Box, styled} from "@mui/material";
import {ActionButton} from "../../Styled";

const ModeSwitchContainer = styled(Box)(({theme}) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        top: theme.spacing(2),
        right: theme.spacing(2),
    };
});

export type mode = "segments" | "virtual_restrictions";

const ModeSwitchAction: React.FunctionComponent<{ currentMode: mode, setMode: (newMode: mode) => void }> = (
    {
        currentMode,
        setMode
    }
): JSX.Element => {
    const modeStrings = {
        "segments": "Edit virtual restrictions",
        "virtual_restrictions": "Edit segments"
    } as Record<mode, string>;



    return (
        <ModeSwitchContainer>
            <ActionButton
                color="inherit"
                size="medium"
                variant="extended"
                onClick={() => {
                    if (currentMode === "segments") {
                        setMode("virtual_restrictions");
                    } else {
                        setMode("segments");
                    }
                }}
            >
                {modeStrings[currentMode]}
            </ActionButton>
        </ModeSwitchContainer>
    );
};

export default ModeSwitchAction;
