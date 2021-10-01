import {Grid, styled} from "@mui/material";

export const FullHeightGrid = styled(Grid)(({ theme }) => {
    return {
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        width: "100%",
        flexWrap: "nowrap",
    };
});
