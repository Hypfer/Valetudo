import {
    Capability,
    StatusState,
    useCombinedVirtualRestrictionsMutation,
    useCombinedVirtualRestrictionsPropertiesQuery,
    ValetudoRestrictedZone,
    ValetudoRestrictedZoneType
} from "../../../api";
import React from "react";
import {Box, Button, CircularProgress, Container, Grid2, Typography} from "@mui/material";
import {ActionButton} from "../../Styled";
import VirtualWallClientStructure from "../../structures/client_structures/VirtualWallClientStructure";
import NoGoAreaClientStructure from "../../structures/client_structures/NoGoAreaClientStructure";
import NoMopAreaClientStructure from "../../structures/client_structures/NoMopAreaClientStructure";
import RestrictedZoneClientStructure from "../../structures/client_structures/RestrictedZoneClientStructure";
import {PointCoordinates} from "../../utils/types";
import {
    Save as SaveIcon,
    Refresh as RefreshIcon, Clear as ClearIcon,
} from "@mui/icons-material";
import {
    AddNoGoAreaIcon,
    AddNoMopAreaIcon,
    AddVirtualWallIcon
} from "../../../components/CustomIcons";

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
    onClear(): void;
}

const VirtualRestrictionActions = (
    props: VirtualRestrictionActionsProperties
): React.ReactElement => {
    const {
        virtualWalls,
        noGoAreas,
        noMopAreas,

        convertPixelCoordinatesToCMSpace,


        onAddVirtualWall,
        onAddNoGoArea,
        onAddNoMopArea,

        onSave,
        onRefresh,
        onClear
    } = props;


    const {
        data: combinedVirtualRestrictionsProperties,
        isPending: combinedVirtualRestrictionsPropertiesPending,
        isError: combinedVirtualRestrictionsPropertiesLoadError,
        refetch: refetchCombinedVirtualRestrictionsProperties,
    } = useCombinedVirtualRestrictionsPropertiesQuery();

    const {
        mutate: saveRestrictions,
        isPending: restrictionsSaving
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
                    <RefreshIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                    Retry
                </Button>
            </Container>
        );
    }

    if (combinedVirtualRestrictionsProperties === undefined && combinedVirtualRestrictionsPropertiesPending) {
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
            </Container>
        );
    }


    return (
        <Grid2 container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            {
                canEdit &&

                <Grid2>
                    <ActionButton
                        disabled={restrictionsSaving}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleSaveClick}
                    >
                        <SaveIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Save
                        {restrictionsSaving && (
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

                <Grid2>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddVirtualWall}
                    >
                        <AddVirtualWallIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        Wall ({virtualWalls.length})
                    </ActionButton>
                </Grid2>
            }
            {
                canEdit &&
                combinedVirtualRestrictionsProperties.supportedRestrictedZoneTypes.includes(ValetudoRestrictedZoneType.Regular) &&

                <Grid2>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddNoGoArea}
                    >
                        <AddNoGoAreaIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        No-Go ({noGoAreas.length})
                    </ActionButton>
                </Grid2>
            }
            {
                canEdit &&
                combinedVirtualRestrictionsProperties.supportedRestrictedZoneTypes.includes(ValetudoRestrictedZoneType.Mop) &&

                <Grid2>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddNoMopArea}
                    >
                        <AddNoMopAreaIcon style={{marginRight: "0.25rem", marginLeft: "-0.25rem"}}/>
                        No-Mop ({noMopAreas.length})
                    </ActionButton>
                </Grid2>
            }
            {
                canEdit &&

                <Grid2>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        disabled={noGoAreas.length === 0 && noMopAreas.length === 0 && virtualWalls.length === 0}
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
                        Editing virtual restrictions requires the robot to be docked
                    </Typography>
                </Grid2>
            }
        </Grid2>
    );
};

export default VirtualRestrictionActions;
