import {
    Capability,
    useCleanZonesMutation,
    useRobotStatusQuery,
    useZonePropertiesQuery,
} from "../../../api";
import React from "react";
import {Box, Button, CircularProgress, Container, Grid2, Typography} from "@mui/material";
import { useLongPress } from "use-long-press";
import {ActionButton} from "../../Styled";
import ZoneClientStructure from "../../structures/client_structures/ZoneClientStructure";
import IntegrationHelpDialog from "../../../components/IntegrationHelpDialog";
import {PointCoordinates} from "../../utils/types";
import {IterationsIcon} from "../../../assets/icon_components/IterationsIcon";
import {
    Clear as ClearIcon,
    PlayArrow as GoIcon,
    Add as AddIcon
} from "@mui/icons-material";

interface ZoneActionsProperties {
    zones: ZoneClientStructure[];

    convertPixelCoordinatesToCMSpace(coordinates: PointCoordinates) : PointCoordinates

    onClear(): void;

    onAdd(): void;
}

const ZoneActions = (
    props: ZoneActionsProperties
): React.ReactElement => {
    const { zones, convertPixelCoordinatesToCMSpace, onClear, onAdd } = props;
    const [iterationCount, setIterationCount] = React.useState(1);
    const [integrationHelpDialogOpen, setIntegrationHelpDialogOpen] = React.useState(false);
    const [integrationHelpDialogPayload, setIntegrationHelpDialogPayload] = React.useState("");

    const { data: status } = useRobotStatusQuery((state) => {
        return state.value;
    });
    const {
        mutate: cleanTemporaryZones,
        isPending: cleanTemporaryZonesIsExecuting
    } = useCleanZonesMutation({
        onSuccess: onClear,
    });
    const {
        data: zoneProperties,
        isPending: zonePropertiesPending,
        isError: zonePropertiesLoadError,
        refetch: refetchZoneProperties,
    } = useZonePropertiesQuery();

    const canClean = status === "idle" || status === "docked" || status === "paused" || status === "returning" || status === "error";
    const didSelectZones = zones.length > 0;

    const zonesForAPI = React.useMemo(() => {
        return zones.map((zone) => {
            return {
                points: {
                    pA: convertPixelCoordinatesToCMSpace({
                        x: zone.x0,
                        y: zone.y0
                    }),
                    pB: convertPixelCoordinatesToCMSpace({
                        x: zone.x1,
                        y: zone.y0
                    }),
                    pC: convertPixelCoordinatesToCMSpace({
                        x: zone.x1,
                        y: zone.y1
                    }),
                    pD: convertPixelCoordinatesToCMSpace({
                        x: zone.x0,
                        y: zone.y1
                    })
                }
            };
        });
    }, [zones, convertPixelCoordinatesToCMSpace]);

    const handleClick = React.useCallback(() => {
        if (!didSelectZones || !canClean) {
            return;
        }

        cleanTemporaryZones({
            zones: zonesForAPI,
            iterations: iterationCount
        });
    }, [canClean, didSelectZones, zonesForAPI, iterationCount, cleanTemporaryZones]);

    const handleLongClick = React.useCallback(() => {
        setIntegrationHelpDialogPayload(JSON.stringify({
            action: "clean",
            zones: zonesForAPI,
            iterations: iterationCount
        }, null, 2));

        setIntegrationHelpDialogOpen(true);
    }, [zonesForAPI, iterationCount]);

    const setupClickHandlers = useLongPress(
        handleLongClick,
        {
            onCancel: (event) => {
                handleClick();
            },
            threshold: 500,
            captureEvent: true,
            cancelOnMovement: true,
        }
    );

    const handleIterationToggle = React.useCallback(() => {
        if (zoneProperties) {
            setIterationCount(iterationCount % zoneProperties.iterationCount.max + 1);
        }
    }, [iterationCount, setIterationCount, zoneProperties]);

    if (zonePropertiesLoadError) {
        return (
            <Container>
                <Typography color="error">
                    Error loading {Capability.ZoneCleaning} properties
                </Typography>
                <Box m={1}/>
                <Button color="primary" variant="contained" onClick={() => {
                    return refetchZoneProperties();
                }}>
                    Retry
                </Button>
            </Container>
        );
    }

    if (zoneProperties === undefined && zonePropertiesPending) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    if (zoneProperties === undefined) {
        return (
            <Container>
                <Typography align="center">
                    No {Capability.ZoneCleaning} properties
                </Typography>
                ;
            </Container>
        );
    }

    return (
        <>
            <Grid2 container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
                <Grid2>
                    <ActionButton
                        disabled={!didSelectZones || cleanTemporaryZonesIsExecuting || !canClean}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        {...setupClickHandlers()}
                    >
                        <GoIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Clean {zones.length} zones
                        {cleanTemporaryZonesIsExecuting && (
                            <CircularProgress
                                color="inherit"
                                size={18}
                                style={{ marginLeft: 10 }}
                            />
                        )}
                    </ActionButton>
                </Grid2>
                {
                    zoneProperties.iterationCount.max > 1 &&
                    <Grid2>
                        <ActionButton
                            color="inherit"
                            size="medium"
                            variant="extended"
                            style={{
                                textTransform: "initial"
                            }}
                            onClick={handleIterationToggle}
                            title="Iteration Count"
                        >
                            <IterationsIcon iterationCount={iterationCount}/>
                        </ActionButton>
                    </Grid2>
                }
                <Grid2>
                    <ActionButton
                        disabled={zones.length === zoneProperties.zoneCount.max || cleanTemporaryZonesIsExecuting}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAdd}
                    >
                        <AddIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Add ({zones.length}/{zoneProperties.zoneCount.max})
                    </ActionButton>
                </Grid2>
                {
                    didSelectZones &&
                    <Grid2>
                        <ActionButton
                            disabled={cleanTemporaryZonesIsExecuting}
                            color="inherit"
                            size="medium"
                            variant="extended"
                            onClick={onClear}
                        >
                            <ClearIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                            Clear
                        </ActionButton>
                    </Grid2>
                }
                {
                    (didSelectZones && !canClean) &&
                    <Grid2>
                        <Typography variant="caption" color="textSecondary">
                            Cannot start zone cleaning while the robot is busy
                        </Typography>
                    </Grid2>
                }
            </Grid2>
            <IntegrationHelpDialog
                dialogOpen={integrationHelpDialogOpen}
                setDialogOpen={(open: boolean) => {
                    setIntegrationHelpDialogOpen(open);
                }}
                coordinatesWarning={true}
                helperText={"To start a cleanup of the currently drawn zones with the currently configured parameters via MQTT or REST, simply use this payload."}
                payload={integrationHelpDialogPayload}
            />
        </>
    );
};

export default ZoneActions;
