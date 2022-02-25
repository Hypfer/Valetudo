import {Box, Button, CircularProgress, styled, Typography, useTheme} from "@mui/material";
import {Capability, useMapSegmentationPropertiesQuery, useRobotMapQuery} from "../api";
import LiveMap from "./LiveMap";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";


const Container = styled(Box)({
    flex: "1",
    height: "100%",
    display: "flex",
    flexFlow: "column",
    justifyContent: "center",
    alignItems: "center",
});

const LiveMapPage = (props: Record<string, never> ): JSX.Element => {
    const {
        data: mapData,
        isLoading: mapIsLoading,
        isError: mapLoadError,
        refetch: refetchMap
    } = useRobotMapQuery();

    const [
        goToLocationCapabilitySupported,
        mapSegmentationCapabilitySupported,
        zoneCleaningCapabilitySupported,

        locateCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.GoToLocation,
        Capability.MapSegmentation,
        Capability.ZoneCleaning,

        Capability.Locate
    );

    const {
        data: mapSegmentationProperties,
        isLoading: mapSegmentationPropertiesLoading
    } = useMapSegmentationPropertiesQuery(mapSegmentationCapabilitySupported);

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

    if (
        (!mapData && mapIsLoading) ||
        (mapSegmentationCapabilitySupported && !mapSegmentationProperties && mapSegmentationPropertiesLoading)
    ) {
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

    return <LiveMap
        rawMap={mapData}
        theme={theme}
        trackSegmentSelectionOrder={mapSegmentationProperties ? mapSegmentationProperties.customOrderSupport : false}

        supportedCapabilities={{
            [Capability.MapSegmentation]: mapSegmentationCapabilitySupported,
            [Capability.ZoneCleaning]: zoneCleaningCapabilitySupported,
            [Capability.GoToLocation]: goToLocationCapabilitySupported,
            [Capability.Locate]: locateCapabilitySupported
        }}
    />;
};

export default LiveMapPage;
