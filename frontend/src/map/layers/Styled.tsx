import {Box, emphasize, Fab, styled} from "@mui/material";

export const LayerActionButton = styled(Fab)(({theme}) => {
    return {
        pointerEvents: "auto",
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        "&:hover": {
            backgroundColor: emphasize(theme.palette.background.paper, 0.15),
        },
    };
});

export const LayerActionsContainer = styled(Box)(({theme}) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        bottom: theme.spacing(2),
        left: theme.spacing(2),
        right: theme.spacing(2),
    };
});
