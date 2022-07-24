import {Box, Button, CircularProgress, styled, Typography, useTheme} from "@mui/material";
import {
    useRobotMapQuery,
    useRobotStatusQuery
} from "../api";
import RobotCoverageMap from "./RobotCoverageMap";
import {RobotCoverageMapHelp} from "./res/RobotCoverageMapHelp";


const Container = styled(Box)({
    flex: "1",
    height: "100%",
    display: "flex",
    flexFlow: "column",
    justifyContent: "center",
    alignItems: "center",
});

const RobotCoverageMapPage = (): JSX.Element => {
    const {
        data: mapData,
        isLoading: mapIsLoading,
        isError: mapLoadError,
        refetch: refetchMap
    } = useRobotMapQuery();
    const {
        data: robotStatus,
        isLoading: robotStatusLoading
    } = useRobotStatusQuery();

    const theme = useTheme();

    if (mapLoadError) {
        return (
            <Container>
                <Typography color="error">Error loading map data</Typography>
                <Box m={1}/>
                <Button color="primary" variant="contained" onClick={() => {
                    return refetchMap();
                }}>
                    Retry
                </Button>
            </Container>
        );
    }

    if ((!mapData && mapIsLoading) || (!robotStatus && robotStatusLoading)) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    if (!mapData) {
        return (
            <Container>
                <Typography align="center">No map data</Typography>;
            </Container>
        );
    }

    if (!robotStatus) {
        return (
            <Container>
                <Typography align="center">No robot status</Typography>;
            </Container>
        );
    }

    return <RobotCoverageMap
        rawMap={mapData}
        theme={theme}
        helpText={RobotCoverageMapHelp}
    />;
};

export default RobotCoverageMapPage;
