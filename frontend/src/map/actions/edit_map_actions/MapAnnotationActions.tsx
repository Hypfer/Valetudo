import {
    Capability,
    StatusState,
    useMapAnnotationsMutation,
    useMapAnnotationsPropertiesQuery,
    ValetudoMapAnnotation,
    ValetudoMapAnnotationType,
} from "../../../api";
import React from "react";
import {Box, Button, CircularProgress, Container, Grid2, Typography} from "@mui/material";
import {ActionButton} from "../../Styled";
import {PointCoordinates} from "../../utils/types";
import {Add as AddIcon, Clear as ClearIcon, Refresh as RefreshIcon, Save as SaveIcon,} from "@mui/icons-material";
import {AddCurtainIcon, AddRampIcon, AddThresholdIcon} from "../../../components/CustomIcons";
import MapActionsCombinedActionsMenuPopoverButton from "../../MapActionsCombinedActionsMenuPopoverButton";
import ThresholdClientStructure from "../../structures/client_structures/ThresholdClientStructure";
import CurtainClientStructure from "../../structures/client_structures/CurtainClientStructure";
import RampClientStructure from "../../structures/client_structures/RampClientStructure";

interface MapAnnotationActionsProperties {
    robotStatus: StatusState,
    thresholds: Array<ThresholdClientStructure>,
    curtains: Array<CurtainClientStructure>,
    ramps: Array<RampClientStructure>,

    convertPixelCoordinatesToCMSpace(coordinates: PointCoordinates) : PointCoordinates

    onAddThreshold(): void,
    onAddCurtain(): void,
    onAddRamp(): void,

    onSave(): void;
    onRefresh(): void;
    onClear(): void;
}

const MapAnnotationActions = (
    props: MapAnnotationActionsProperties
): React.ReactElement => {
    const {
        thresholds,
        curtains,
        ramps,

        convertPixelCoordinatesToCMSpace,


        onAddThreshold,
        onAddCurtain,
        onAddRamp,

        onSave,
        onRefresh,
        onClear
    } = props;


    const {
        data: mapAnnotationsProperties,
        isPending: mapAnnotationsPropertiesPending,
        isError: mapAnnotationsPropertiesLoadError,
        refetch: refetchMapAnnotationsProperties,
    } = useMapAnnotationsPropertiesQuery();

    const {
        mutate: saveAnnotations,
        isPending: annotationsSaving
    } = useMapAnnotationsMutation({
        onSuccess: onSave,
    });
    const canEdit = props.robotStatus.value === "docked";

    const handleSaveClick = React.useCallback(() => {
        if (!canEdit) {
            return;
        }
        const mapAnnotations : Array<ValetudoMapAnnotation> = [];

        thresholds.forEach((t) => {
            const pA = convertPixelCoordinatesToCMSpace({
                x: t.x0,
                y: t.y0
            });
            const pC = convertPixelCoordinatesToCMSpace({
                x: t.x1,
                y: t.y1
            });

            mapAnnotations.push({
                type: ValetudoMapAnnotationType.Threshold,
                points: [ pA, pC ]
            });
        });

        curtains.forEach((t) => {
            const pA = convertPixelCoordinatesToCMSpace({
                x: t.x0,
                y: t.y0
            });
            const pC = convertPixelCoordinatesToCMSpace({
                x: t.x1,
                y: t.y1
            });

            mapAnnotations.push({
                type: ValetudoMapAnnotationType.Curtain,
                points: [ pA, pC ]
            });
        });

        ramps.forEach((t) => {
            mapAnnotations.push({
                type: ValetudoMapAnnotationType.Ramp,
                points: [
                    convertPixelCoordinatesToCMSpace({
                        x: t.x0,
                        y: t.y0
                    }),
                    convertPixelCoordinatesToCMSpace({
                        x: t.x1,
                        y: t.y1
                    }),
                    convertPixelCoordinatesToCMSpace({
                        x: t.x2,
                        y: t.y2
                    }),
                    convertPixelCoordinatesToCMSpace({
                        x: t.x3,
                        y: t.y3
                    })
                ]
            });
        });

        saveAnnotations(mapAnnotations);
    }, [canEdit, saveAnnotations, thresholds, curtains, ramps, convertPixelCoordinatesToCMSpace]);

    if (mapAnnotationsPropertiesLoadError) {
        return (
            <Container>
                <Typography color="error">
                    Error loading {Capability.MapAnnotations} properties
                </Typography>
                <Box m={1}/>
                <Button color="primary" variant="contained" onClick={() => {
                    return refetchMapAnnotationsProperties();
                }}>
                    <RefreshIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                    Retry
                </Button>
            </Container>
        );
    }

    if (mapAnnotationsProperties === undefined && mapAnnotationsPropertiesPending) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    if (mapAnnotationsProperties === undefined) {
        return (
            <Container>
                <Typography align="center">
                    No {Capability.MapAnnotations} properties
                </Typography>
            </Container>
        );
    }


    return (
        <Grid2 container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            {
                canEdit &&
                <Grid2>
                    <ActionButton
                        disabled={annotationsSaving}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleSaveClick}
                    >
                        <SaveIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Save
                        {annotationsSaving && (
                            <CircularProgress
                                color="inherit"
                                size={18}
                                style={{marginLeft: 10}}
                            />
                        )}
                    </ActionButton>
                </Grid2>
            }
            {
                canEdit &&

                <MapActionsCombinedActionsMenuPopoverButton
                    icon={<AddIcon/>}
                    label="Add"
                    disabled={annotationsSaving}
                >
                    {(close) => (
                        <>
                            {
                                mapAnnotationsProperties.supportedAnnotationTypes.includes(ValetudoMapAnnotationType.Threshold) &&
                                <ActionButton
                                    color="inherit"
                                    size="medium"
                                    variant="extended"
                                    onClick={() => {
                                        onAddThreshold();
                                        close();
                                    }}
                                >
                                    <AddThresholdIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                                    Threshold ({thresholds.length})
                                </ActionButton>
                            }
                            {
                                mapAnnotationsProperties.supportedAnnotationTypes.includes(ValetudoMapAnnotationType.Curtain) &&
                                <ActionButton
                                    color="inherit"
                                    size="medium"
                                    variant="extended"
                                    onClick={() => {
                                        onAddCurtain();
                                        close();
                                    }}
                                >
                                    <AddCurtainIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                                    Curtain ({curtains.length})
                                </ActionButton>
                            }
                            {
                                mapAnnotationsProperties.supportedAnnotationTypes.includes(ValetudoMapAnnotationType.Ramp) &&
                                <ActionButton
                                    color="inherit"
                                    size="medium"
                                    variant="extended"
                                    onClick={() => {
                                        onAddRamp();
                                        close();
                                    }}
                                >
                                    <AddRampIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                                    Ramp ({ramps.length})
                                </ActionButton>
                            }
                        </>
                    )}
                </MapActionsCombinedActionsMenuPopoverButton>
            }
            {
                canEdit &&
                <Grid2>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        disabled={thresholds.length === 0 && curtains.length === 0 && ramps.length === 0}
                        variant="extended"
                        onClick={onClear}
                    >
                        <ClearIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Clear
                    </ActionButton>
                </Grid2>
            }
            {
                canEdit &&
                <Grid2>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onRefresh}
                    >
                        <RefreshIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Refresh
                    </ActionButton>
                </Grid2>
            }
            {
                !canEdit &&
                <Grid2>
                    <Typography variant="caption" color="textSecondary">
                        Editing map annotations requires the robot to be docked
                    </Typography>
                </Grid2>
            }
        </Grid2>
    );
};

export default MapAnnotationActions;
