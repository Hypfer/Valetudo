import {Box, Button, CircularProgress, styled, Typography, useTheme} from "@mui/material";
import {
    Capability,
    useRobotMapQuery
} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import EditMap from "./EditMap";


const Container = styled(Box)({
    flex: "1",
    height: "100%",
    display: "flex",
    flexFlow: "column",
    justifyContent: "center",
    alignItems: "center",
});

const EditMapPage = (props: Record<string, never> ): JSX.Element => {
    const {
        data: mapData,
        isLoading: mapIsLoading,
        isError: mapLoadError,
        refetch: refetchMap
    } = useRobotMapQuery();

    const [
        combinedVirtualRestrictionsCapabilitySupported,

        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.CombinedVirtualRestrictions,

        Capability.MapSegmentEdit,
        Capability.MapSegmentRename
    );

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

    return <EditMap
        rawMap={mapData}
        theme={theme}

        supportedCapabilities={{
            [Capability.CombinedVirtualRestrictions]: combinedVirtualRestrictionsCapabilitySupported,

            [Capability.MapSegmentEdit]: mapSegmentEditCapabilitySupported,
            [Capability.MapSegmentRename]: mapSegmentRenameCapabilitySupported,
        }}
    />;
};

export default EditMapPage;
