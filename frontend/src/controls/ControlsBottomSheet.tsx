import { Box, Divider, Grid, styled, Typography } from "@mui/material";
import { BottomSheet } from "react-spring-bottom-sheet";
import ControlsBody from "./ControlsBody";
import "react-spring-bottom-sheet/dist/style.css";

const StyledBottomSheet = styled(BottomSheet)(({ theme }) => {
    return {
        "--rsbs-bg": theme.palette.background.paper,
        "--rsbs-handle-bg": "hsla(0, 0%, 100%, 0.14)",
        "--rsbs-max-w": "auto",
        "--rsbs-ml": "env(safe-area-inset-left)",
        "--rsbs-mr": "env(safe-area-inset-right)",
        "--rsbs-overlay-rounded": "8px",
        zIndex: theme.zIndex.drawer,
        "& [data-rsbs-overlay]": {
            zIndex: theme.zIndex.drawer + 1,
        },
        "& [data-rsbs-header]": {
            padding: 0,
        },
    };
});

const Sheet = styled(Box)(({ theme }) => {
    return {
        backgroundColor: theme.palette.background.default,
    };
});

const ControlsBottomSheet = (): JSX.Element => {
    return (
        <StyledBottomSheet
            open
            blocking={false}
            snapPoints={({ maxHeight, headerHeight }) => {
                return [
                    headerHeight,
                    maxHeight * 0.2,
                    maxHeight * 0.5,
                    maxHeight * 0.8,
                ];
            }}
            header={
                <>
                    <Grid container>
                        <Grid item>
                            <Box px={2} pt={2} pb={1}>
                                <Typography variant="subtitle1">Controls</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    <Divider />
                </>
            }
        >
            <Sheet p={1}>
                <ControlsBody />
            </Sheet>
        </StyledBottomSheet>
    );
};

export default ControlsBottomSheet;
