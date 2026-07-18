import {Box, emphasize, Fab, styled} from "@mui/material";

export const ActionButton = styled(Fab)(({theme}) => {
    return {
        pointerEvents: "auto",
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        "@media (hover: hover)": {
            "&:hover": {
                backgroundColor: emphasize(theme.palette.background.paper, 0.15),
            },
        },
        "@media (hover: none)": {
            "&:hover": {
                backgroundColor: theme.palette.background.paper,
            },
        },
    };
});

export const ActionsContainer = styled(Box)(({theme}) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        bottom: theme.spacing(2),
        left: theme.spacing(2),
        right: theme.spacing(2),
    };
});
