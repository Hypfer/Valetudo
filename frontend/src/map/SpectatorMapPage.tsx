import {Box, Button, CircularProgress, styled, Typography, useMediaQuery, useTheme} from "@mui/material";
import {
    Capability,
    useDuststreamingConfigurationQuery,
    useDuststreamingPropertiesQuery,
    useRobotMapQuery,
} from "../api";
import React from "react";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {DuststreamCanvas, DuststreamPlaceholder} from "../robot/Duststream";
import BaseMap, {MapContainer, MapProps, MapState} from "./BaseMap";


const Container = styled(Box)({
    flex: "1",
    height: "100%",
    display: "flex",
    flexFlow: "column",
    justifyContent: "center",
    alignItems: "center",
});

class SpectatorMap extends BaseMap<MapProps, MapState> {
    constructor(props: MapProps) {
        super(props);

        this.state = {
            selectedSegmentIds: [],
            dialogOpen: false,
            dialogTitle: "Hello World",
            dialogBody: "This should never be visible",
        };
    }

    render(): React.ReactElement {
        return (
            <MapContainer style={{overflow: "hidden"}}>
                <canvas
                    ref={this.canvasRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        imageRendering: "crisp-edges"
                    }}
                />
            </MapContainer>
        );
    }
}

type CameraSize = "small" | "medium" | "large" | "fullscreen";

const CAMERA_SIZES: Record<CameraSize, {width: string, borderRadius: string, margin: string}> = {
    small: {width: "25vmin", borderRadius: "8px", margin: "32px"},
    medium: {width: "40vmin", borderRadius: "8px", margin: "32px"},
    large: {width: "65vmin", borderRadius: "8px", margin: "32px"},
    fullscreen: {width: "100%", borderRadius: "0", margin: "0"},
};

const CAMERA_SIZE_ORDER: CameraSize[] = ["small", "medium", "large", "fullscreen"];

const SpectatorMapPage = (): React.ReactElement => {
    const {
        data: mapData,
        isPending: mapIsPending,
        isError: mapLoadError,
        refetch: refetchMap
    } = useRobotMapQuery();

    const [
        duststreamingSupported,
    ] = useCapabilitiesSupported(
        Capability.Duststreaming
    );

    const {data: duststreamingProperties} = useDuststreamingPropertiesQuery();
    const {data: duststreamingConfiguration} = useDuststreamingConfigurationQuery();

    const duststreamingEnabled = duststreamingConfiguration?.enabled === true;

    const [cameraSize, setCameraSize] = React.useState<CameraSize>("small");
    const cycleLockRef = React.useRef(false);
    const useSplitLayout = useMediaQuery("(max-aspect-ratio: 3/5)");

    const cycleCameraSize = () => {
        if (cycleLockRef.current) {
            return;
        }

        cycleLockRef.current = true;
        setTimeout(() => {
            cycleLockRef.current = false;
        }, 75);

        setCameraSize((prev) => {
            return CAMERA_SIZE_ORDER[
                (CAMERA_SIZE_ORDER.indexOf(prev) + 1) % CAMERA_SIZE_ORDER.length
            ];
        });
    };

    React.useEffect(() => {
        if (cameraSize !== "fullscreen") {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setCameraSize("small");
            }
        };

        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("keydown", handler);
        };
    }, [cameraSize]);

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

    if (!mapData && mapIsPending) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    if (!mapData) {
        return (
            <Container>
                <Typography align="center">No map data</Typography>
            </Container>
        );
    }

    const showCamera = duststreamingSupported && duststreamingEnabled && !!duststreamingProperties;
    const duststreamerInstalled = duststreamingProperties?.duststreamerInstalled === true;

    const cameraContent = duststreamingProperties ? (
        duststreamerInstalled ? (
            <DuststreamCanvas dimensions={duststreamingProperties}/>
        ) : (
            <DuststreamPlaceholder dimensions={duststreamingProperties}/>
        )
    ) : null;

    if (useSplitLayout && showCamera && duststreamingProperties) {
        const videoAspect = duststreamingProperties.width / duststreamingProperties.height;

        return (
            <Box sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}>
                <Box sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden"
                }}>
                    <SpectatorMap
                        rawMap={mapData}
                        paletteMode={theme.palette.mode}
                    />
                </Box>
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        maxWidth: `${videoAspect * 40}vh`,
                        mx: "auto",
                        aspectRatio: `${duststreamingProperties.width} / ${duststreamingProperties.height}`,
                        bgcolor: "#000",
                        overflow: "hidden",
                        flexShrink: 0,
                    }}
                >
                    {cameraContent}
                </Box>
            </Box>
        );
    }

    const cameraStyle = CAMERA_SIZES[cameraSize];

    return (
        <Box sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden"
        }}>
            <SpectatorMap
                rawMap={mapData}
                paletteMode={theme.palette.mode}
            />
            {showCamera && duststreamingProperties && (
                <Box
                    onClick={cycleCameraSize}
                    sx={{
                        position: "absolute",
                        bottom: cameraStyle.margin,
                        left: cameraStyle.margin,
                        right: cameraSize === "fullscreen" ? "0" : "auto",
                        top: cameraSize === "fullscreen" ? "0" : "auto",
                        width: cameraStyle.width,
                        maxWidth: "100%",
                        ...(cameraSize !== "fullscreen" && {
                            aspectRatio: `${duststreamingProperties.width} / ${duststreamingProperties.height}`,
                        }),
                        ...(cameraSize === "fullscreen" && {
                            height: "100%",
                        }),
                        bgcolor: "#000",
                        border: cameraSize === "fullscreen" ? "none" : `2px solid ${theme.palette.divider}`,
                        borderRadius: cameraStyle.borderRadius,
                        boxShadow: cameraSize === "fullscreen" ? 0 : 3,
                        overflow: "hidden",
                        zIndex: 10,
                        cursor: "pointer",
                        userSelect: "none",
                    }}
                >
                    {cameraContent}
                </Box>
            )}
        </Box>
    );
};

export default SpectatorMapPage;
