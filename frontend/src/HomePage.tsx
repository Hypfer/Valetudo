import {Box, Divider, Grid, styled} from "@mui/material";
import ControlsBody from "./controls";
import ControlsBottomSheet from "./controls/ControlsBottomSheet";
import {useIsMobileView} from "./hooks";
import MapPage from "./map";
import {FullHeightGrid} from "./components/FullHeightGrid";

const ScrollableGrid = styled(Grid)({
    overflow: "auto",
});

const HomePage = (): JSX.Element => {
    const mobileView = useIsMobileView();

    if (mobileView) {
        return (
            // Padding set to height of the header of the bottom controls sheet
            <Box paddingBottom="52px" width={1} height={1}>
                <MapPage/>
                <ControlsBottomSheet/>
            </Box>
        );
    }

    return (
        <FullHeightGrid container direction="row" justifyContent="space-evenly">
            <Grid item sm md lg xl>
                <MapPage/>
            </Grid>
            <Divider orientation="vertical"/>
            <ScrollableGrid item sm={4} md={4} lg={4} xl={3}>
                <Box m={1}>
                    <ControlsBody/>
                </Box>
            </ScrollableGrid>
        </FullHeightGrid>
    );
};

export default HomePage;
