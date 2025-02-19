import {Grid2, styled} from "@mui/material";

export const FullHeightGrid = styled(Grid2)(({ theme }) => {
    return {
        height: `calc(100% - ${theme.mixins.toolbar.minHeight}px)`,
        width: "100%",
        flexWrap: "nowrap",
        overflow: "hidden" //TODO: Fixme :(
    };
});
