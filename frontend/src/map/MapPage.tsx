import {Box, Button, CircularProgress, styled, Typography,} from "@mui/material";
import {useRobotMapQuery} from "../api";
import MapLayers from "./layers";
import {MapLayersPropTypes} from "./layers/MapLayers";

const Container = styled(Box)({
    flex: "1",
    height: "100%",
    display: "flex",
    flexFlow: "column",
    justifyContent: "center",
    alignItems: "center",
});

const MapPage = (props: MapLayersPropTypes): JSX.Element => {
    const {
        data: mapData,
        isLoading: mapIsLoading,
        isError: mapLoadError,
        refetch: refetchMap
    } = useRobotMapQuery();

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

    if (!mapData && mapIsLoading) {
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

    return <MapLayers data={mapData} padding={4 * 8} {...props}/>;
};

export default MapPage;
