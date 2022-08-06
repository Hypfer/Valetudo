import {
    Capability,
    StatusState,
    useCombinedVirtualRestrictionsMutation,
    useCombinedVirtualRestrictionsPropertiesQuery,
    ValetudoRestrictedZone,
    ValetudoRestrictedZoneType
} from "../../../api";
import React from "react";
import {Box, Button, CircularProgress, Container, Grid, Typography} from "@mui/material";
import {ActionButton} from "../../Styled";
import VirtualWallClientStructure from "../../structures/client_structures/VirtualWallClientStructure";
import NoGoAreaClientStructure from "../../structures/client_structures/NoGoAreaClientStructure";
import NoMopAreaClientStructure from "../../structures/client_structures/NoMopAreaClientStructure";
import RestrictedZoneClientStructure from "../../structures/client_structures/RestrictedZoneClientStructure";
import {PointCoordinates} from "../../utils/types";

interface VirtualRestrictionActionsProperties {
    robotStatus: StatusState,
    virtualWalls: Array<VirtualWallClientStructure>,
    noGoAreas: Array<NoGoAreaClientStructure>,
    noMopAreas: Array<NoMopAreaClientStructure>,

    convertPixelCoordinatesToCMSpace(coordinates: PointCoordinates) : PointCoordinates

    onAddVirtualWall(): void,
    onAddNoGoArea(): void,
    onAddNoMopArea(): void,

    onSave(): void;
    onRefresh(): void;
}

const VirtualRestrictionActions = (
    props: VirtualRestrictionActionsProperties
): JSX.Element => {
    const {
        virtualWalls,
        noGoAreas,
        noMopAreas,

        convertPixelCoordinatesToCMSpace,


        onAddVirtualWall,
        onAddNoGoArea,
        onAddNoMopArea,

        onSave,
        onRefresh
    } = props;


    const {
        data: combinedVirtualRestrictionsProperties,
        isLoading: combinedVirtualRestrictionsPropertiesLoading,
        isError: combinedVirtualRestrictionsPropertiesLoadError,
        refetch: refetchCombinedVirtualRestrictionsProperties,
    } = useCombinedVirtualRestrictionsPropertiesQuery();

    const {
        mutate: saveRestrictions,
        isLoading: restrictionsSaving
    } = useCombinedVirtualRestrictionsMutation({
        onSuccess: onSave,
    });
    const canEdit = props.robotStatus.value === "docked";

    const handleSaveClick = React.useCallback(() => {
        if (!canEdit) {
            return;
        }
        const restrictedZones : Array<ValetudoRestrictedZone> = [];

        [...noGoAreas, ...noMopAreas].forEach((rZ : RestrictedZoneClientStructure) => {
            let type : ValetudoRestrictedZoneType = ValetudoRestrictedZoneType.Regular;

            if (rZ.getType() === NoMopAreaClientStructure.TYPE) {
                type = ValetudoRestrictedZoneType.Mop;
            }

            restrictedZones.push({
                type: type,
                points: {
                    pA: convertPixelCoordinatesToCMSpace({
                        x: rZ.x0,
                        y: rZ.y0
                    }),
                    pB: convertPixelCoordinatesToCMSpace({
                        x: rZ.x1,
                        y: rZ.y1
                    }),
                    pC: convertPixelCoordinatesToCMSpace({
                        x: rZ.x2,
                        y: rZ.y2
                    }),
                    pD: convertPixelCoordinatesToCMSpace({
                        x: rZ.x3,
                        y: rZ.y3
                    })
                }
            });
        });

        saveRestrictions({
            virtualWalls: virtualWalls.map(vW => {
                return {
                    points: {
                        pA: convertPixelCoordinatesToCMSpace({
                            x: vW.x0,
                            y: vW.y0
                        }),
                        pB: convertPixelCoordinatesToCMSpace({
                            x: vW.x1,
                            y: vW.y1
                        })
                    }
                };
            }),
            restrictedZones: restrictedZones
        });
    }, [canEdit, saveRestrictions, virtualWalls, noGoAreas, noMopAreas, convertPixelCoordinatesToCMSpace]);

    if (combinedVirtualRestrictionsPropertiesLoadError) {
        return (
            <Container>
                <Typography color="error">
                    Error loading {Capability.CombinedVirtualRestrictions} properties
                </Typography>
                <Box m={1}/>
                <Button color="primary" variant="contained" onClick={() => {
                    return refetchCombinedVirtualRestrictionsProperties();
                }}>
                    Retry
                </Button>
            </Container>
        );
    }

    if (combinedVirtualRestrictionsProperties === undefined && combinedVirtualRestrictionsPropertiesLoading) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    if (combinedVirtualRestrictionsProperties === undefined) {
        return (
            <Container>
                <Typography align="center">
                    No {Capability.CombinedVirtualRestrictions} properties
                </Typography>
                ;
            </Container>
        );
    }


    return (
        <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            {
                canEdit &&

                <Grid item>
                    <ActionButton
                        disabled={restrictionsSaving}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleSaveClick}
                    >
                        Save
                    </ActionButton>
                </Grid>
            }
            {
                canEdit &&

                <Grid item>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddVirtualWall}
                    >
                        Add Virtual Wall
                    </ActionButton>
                </Grid>
            }
            {
                canEdit &&
                combinedVirtualRestrictionsProperties.supportedRestrictedZoneTypes.includes(ValetudoRestrictedZoneType.Regular) &&

                <Grid item>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddNoGoArea}
                    >
                        Add No Go Area
                    </ActionButton>
                </Grid>
            }
            {
                canEdit &&
                combinedVirtualRestrictionsProperties.supportedRestrictedZoneTypes.includes(ValetudoRestrictedZoneType.Mop) &&

                <Grid item>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddNoMopArea}
                    >
                        Add No Mop Area
                    </ActionButton>
                </Grid>
            }

            {
                canEdit &&

                <Grid item>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onRefresh}
                    >
                        Refresh
                    </ActionButton>
                </Grid>
            }
            {
                !canEdit &&
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Editing virtual restrictions requires the robot to be docked
                    </Typography>
                </Grid>
            }
        </Grid>
    );
};

export default VirtualRestrictionActions;
