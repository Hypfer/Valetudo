import React from "react";
import {Box, styled} from "@mui/material";
import {ActionButton} from "../../Styled";
import {
    Help as HelpIcon
} from "@mui/icons-material";

const HelpButtonContainer = styled(Box)(({theme}) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        top: theme.spacing(2),
        right: theme.spacing(2),
    };
});

export type mode = "segments" | "virtual_restrictions";

const ModeSwitchAction: React.FunctionComponent<{ helpDialogOpen: boolean, setHelpDialogOpen: (open: boolean) => void }> = (
    {
        helpDialogOpen,
        setHelpDialogOpen
    }
): JSX.Element => {
    return (
        <HelpButtonContainer>
            <ActionButton
                color="inherit"
                size="medium"
                variant="extended"
                onClick={() => {
                    setHelpDialogOpen(true);
                }}
                title="Help"
            >
                <HelpIcon/>
            </ActionButton>
        </HelpButtonContainer>
    );
};

export default ModeSwitchAction;
