import Map, {MapContainer, MapProps, MapState} from "./Map";
import {
    Capability,
    RawMapEntityType,
    StatusState
} from "../api";
import {ActionsContainer} from "./Styled";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import SegmentActions from "./actions/edit_map_actions/SegmentActions";
import CuttingLineClientStructure from "./structures/client_structures/CuttingLineClientStructure";
import VirtualWallClientStructure from "./structures/client_structures/VirtualWallClientStructure";
import VirtualRestrictionActions from "./actions/edit_map_actions/VirtualRestrictionActions";
import NoGoAreaClientStructure from "./structures/client_structures/NoGoAreaClientStructure";
import NoMopAreaClientStructure from "./structures/client_structures/NoMopAreaClientStructure";
import HelpDialog from "../components/HelpDialog";
import HelpAction from "./actions/edit_map_actions/HelpAction";
import {ProviderContext} from "notistack";
import React from "react";
import {PathDrawer} from "./PathDrawer";

export type mode = "segments" | "virtual_restrictions";

interface EditMapProps extends MapProps {
    supportedCapabilities: {
        [Capability.CombinedVirtualRestrictions]: boolean,

        [Capability.MapSegmentEdit]: boolean,
        [Capability.MapSegmentRename]: boolean
    }
    mode: mode,
    helpText: string,
    robotStatus: StatusState,
    enqueueSnackbar: ProviderContext["enqueueSnackbar"]
}

interface EditMapState extends MapState {
    segmentNames: Record<string, string>,
    cuttingLine: CuttingLineClientStructure | undefined,

    virtualWalls: Array<VirtualWallClientStructure>,
    noGoAreas: Array<NoGoAreaClientStructure>,
    noMopAreas: Array<NoMopAreaClientStructure>,

    helpDialogOpen: boolean
}

class EditMap extends Map<EditMapProps, EditMapState> {
    protected pendingVirtualRestrictionsStructuresUpdate = false;

    constructor(props: EditMapProps) {
        super(props);

        this.state = {
            selectedSegmentIds: [],
            dialogOpen: false,
            dialogTitle: "Hello World",
            dialogBody: "This should never be visible",

            segmentNames: {},
            cuttingLine: undefined,

            virtualWalls: [],
            noGoAreas: [],
            noMopAreas: [],

            helpDialogOpen: false
        };

        this.updateVirtualRestrictionClientStructures(props.mode !== "virtual_restrictions");
    }

    protected async updateDrawableComponents(): Promise<void> {
        await new Promise<void>((resolve) => {
            this.drawableComponentsMutex.take(() => {
                resolve();
            });
        });


        this.drawableComponents = [];

        await this.mapLayerManager.draw(this.props.rawMap, this.props.theme);
        this.drawableComponents.push(this.mapLayerManager.getCanvas());

        this.updateStructures(this.props.mode);

        if (this.props.mode === "virtual_restrictions") {
            const pathsImage = await PathDrawer.drawPaths( {
                pathMapEntities: this.props.rawMap.entities.filter(e => {
                    return e.type === RawMapEntityType.Path;
                }),
                mapWidth: this.props.rawMap.size.x,
                mapHeight: this.props.rawMap.size.y,
                pixelSize: this.props.rawMap.pixelSize,
                paletteMode: this.props.theme.palette.mode,
                opacity: 0.5
            });

            this.drawableComponents.push(pathsImage);
        }

        this.updateState();

        this.drawableComponentsMutex.leave();
    }

    private updateStructures(mode: mode) : void {
        this.structureManager.updateMapStructuresFromMapData({
            metaData: this.props.rawMap.metaData,
            size: this.props.rawMap.size,
            pixelSize: this.props.rawMap.pixelSize,
            layers: this.props.rawMap.layers,
            entities: this.props.rawMap.entities.filter(e => {
                switch (e.type) {
                    case RawMapEntityType.ChargerLocation:
                        return true;
                    default:
                        return false;
                }
            })
        });

        if (mode === "virtual_restrictions") {
            // remove all segment labels
            this.structureManager.getMapStructures().forEach(s => {
                if (s.type === SegmentLabelMapStructure.TYPE) {
                    this.structureManager.removeMapStructure(s);
                }
            });
        }
    }


    protected updateState() : void {
        super.updateState();

        const segmentNames = {} as Record<string, string>;
        this.structureManager.getMapStructures().forEach(s => {
            if (s.type === SegmentLabelMapStructure.TYPE) {
                const label = s as SegmentLabelMapStructure;

                segmentNames[label.id] = label.name ?? label.id;
            }
        });


        this.setState({
            segmentNames: segmentNames,
            cuttingLine: this.structureManager.getClientStructures().find(s => {
                if (s.type === CuttingLineClientStructure.TYPE) {
                    return true;
                }
            }) as CuttingLineClientStructure,

            virtualWalls: this.structureManager.getClientStructures().filter(s => {
                if (s.type === VirtualWallClientStructure.TYPE) {
                    return true;
                }
            }) as Array<VirtualWallClientStructure>,
            noGoAreas: this.structureManager.getClientStructures().filter(s => {
                if (s.type === NoGoAreaClientStructure.TYPE) {
                    return true;
                }
            }) as Array<NoGoAreaClientStructure>,
            noMopAreas: this.structureManager.getClientStructures().filter(s => {
                if (s.type === NoMopAreaClientStructure.TYPE) {
                    return true;
                }
            }) as Array<NoMopAreaClientStructure>
        });
    }

    private updateVirtualRestrictionClientStructures(remove: boolean) : void {
        if (remove) {
            this.structureManager.getClientStructures().forEach(s => {
                switch (s.type) {
                    case VirtualWallClientStructure.TYPE:
                    case NoGoAreaClientStructure.TYPE:
                    case NoMopAreaClientStructure.TYPE:
                        this.structureManager.removeClientStructure(s);
                }
            });
        } else {
            this.props.rawMap.entities.forEach(e => {
                switch (e.type) {
                    case RawMapEntityType.VirtualWall: {
                        const p0 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                        const p1 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});

                        this.structureManager.addClientStructure(new VirtualWallClientStructure(
                            p0.x, p0.y,
                            p1.x, p1.y,
                            false
                        ));
                        break;
                    }
                    case RawMapEntityType.NoGoArea: {
                        const p0 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                        const p1 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});
                        const p2 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[4], y: e.points[5]});
                        const p3 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[6], y: e.points[7]});


                        this.structureManager.addClientStructure(new NoGoAreaClientStructure(
                            p0.x, p0.y,
                            p1.x, p1.y,
                            p2.x, p2.y,
                            p3.x, p3.y,
                            false
                        ));
                        break;
                    }
                    case RawMapEntityType.NoMopArea: {
                        const p0 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                        const p1 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});
                        const p2 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[4], y: e.points[5]});
                        const p3 = this.structureManager.convertCMCoordinatesToPixelSpace({x: e.points[6], y: e.points[7]});


                        this.structureManager.addClientStructure(new NoMopAreaClientStructure(
                            p0.x, p0.y,
                            p1.x, p1.y,
                            p2.x, p2.y,
                            p3.x, p3.y,
                            false
                        ));
                        break;
                    }

                }
            });
        }
    }

    private clearSegmentStructures() : void {
        this.structureManager.getMapStructures().forEach(s => {
            if (s.type === SegmentLabelMapStructure.TYPE) {
                const label = s as SegmentLabelMapStructure;

                label.selected = false;
            }
        });

        this.structureManager.getClientStructures().forEach(s => {
            if (s.type === CuttingLineClientStructure.TYPE) {
                this.structureManager.removeClientStructure(s);
            }
        });

        this.updateState();

        this.redrawLayers();
    }

    protected onMapUpdate() : void {
        if (this.pendingVirtualRestrictionsStructuresUpdate) {
            this.updateVirtualRestrictionClientStructures(true);
            this.updateVirtualRestrictionClientStructures(false);

            this.pendingVirtualRestrictionsStructuresUpdate = false;
        }
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected onTap(evt: any): boolean | void {
        // Only allow map interaction while the robot is docked
        if (this.props.robotStatus.value === "docked") {
            if (super.onTap(evt)) {
                return true;
            }

            if (
                this.props.mode === "segments" &&
                this.state.cuttingLine === undefined
            ) {
                const {x, y} = this.relativeCoordinatesToCanvas(evt.x0, evt.y0);
                const tappedPointInMapSpace = this.ctxWrapper.mapPointToCurrentTransform(x, y);

                const intersectingSegmentId = this.mapLayerManager.getIntersectingSegment(tappedPointInMapSpace.x, tappedPointInMapSpace.y);

                if (intersectingSegmentId) {
                    const segmentLabels = this.structureManager.getMapStructures().filter(s => {
                        return s.type === SegmentLabelMapStructure.TYPE;
                    }) as Array<SegmentLabelMapStructure>;

                    const matchedSegmentLabel = segmentLabels.find(l => {
                        return l.id === intersectingSegmentId;
                    });

                    if (
                        this.state.selectedSegmentIds.length < 2 ||
                        this.state.selectedSegmentIds.includes(intersectingSegmentId)
                    ) {
                        if (matchedSegmentLabel) {
                            matchedSegmentLabel.onTap();

                            this.updateState();
                            this.redrawLayers();

                            return true;
                        }
                    }
                }
            }
        }
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

                <HelpAction
                    helpDialogOpen={this.state.helpDialogOpen}
                    setHelpDialogOpen={(open) => {
                        this.setState({helpDialogOpen: open});
                    }}
                />

                <ActionsContainer>
                    {
                        (
                            this.props.supportedCapabilities[Capability.MapSegmentEdit] ||
                            this.props.supportedCapabilities[Capability.MapSegmentRename]
                        ) &&
                        this.props.mode === "segments" &&

                        <SegmentActions
                            robotStatus={this.props.robotStatus}
                            selectedSegmentIds={this.state.selectedSegmentIds}
                            segmentNames={this.state.segmentNames}
                            cuttingLine={this.state.cuttingLine}
                            convertPixelCoordinatesToCMSpace={(coordinates => {
                                return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                            })}
                            supportedCapabilities={{
                                [Capability.MapSegmentEdit]: this.props.supportedCapabilities[Capability.MapSegmentEdit],
                                [Capability.MapSegmentRename]: this.props.supportedCapabilities[Capability.MapSegmentRename]
                            }}
                            onAddCuttingLine={() => {
                                const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();

                                const p0 = {
                                    x: currentCenter.x -15,
                                    y: currentCenter.y -15
                                };
                                const p1 = {
                                    x: currentCenter.x +15,
                                    y: currentCenter.y +15
                                };

                                this.structureManager.addClientStructure(new CuttingLineClientStructure(
                                    p0.x, p0.y,
                                    p1.x, p1.y,
                                    true
                                ));

                                this.updateState();

                                this.draw();
                            }}
                            onClear={() => {
                                this.clearSegmentStructures();
                            }}
                        />
                    }
                    {
                        (
                            this.props.supportedCapabilities[Capability.CombinedVirtualRestrictions]
                        ) &&
                        this.props.mode === "virtual_restrictions" &&

                        <VirtualRestrictionActions
                            robotStatus={this.props.robotStatus}
                            virtualWalls={this.state.virtualWalls}
                            noGoAreas={this.state.noGoAreas}
                            noMopAreas={this.state.noMopAreas}

                            convertPixelCoordinatesToCMSpace={(coordinates => {
                                return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                            })}

                            onAddVirtualWall={() => {
                                const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();

                                const p0 = {
                                    x: currentCenter.x -15,
                                    y: currentCenter.y -15
                                };
                                const p1 = {
                                    x: currentCenter.x +15,
                                    y: currentCenter.y +15
                                };

                                this.structureManager.addClientStructure(new VirtualWallClientStructure(
                                    p0.x, p0.y,
                                    p1.x, p1.y,
                                    true
                                ));

                                this.updateState();

                                this.draw();
                            }}
                            onAddNoGoArea={() => {
                                const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();

                                const p0 = {
                                    x: currentCenter.x -15,
                                    y: currentCenter.y -15
                                };
                                const p1 = {
                                    x: currentCenter.x +15,
                                    y: currentCenter.y -15
                                };
                                const p2 = {
                                    x: currentCenter.x +15,
                                    y: currentCenter.y +15
                                };
                                const p3 = {
                                    x: currentCenter.x -15,
                                    y: currentCenter.y +15
                                };


                                this.structureManager.addClientStructure(new NoGoAreaClientStructure(
                                    p0.x, p0.y,
                                    p1.x, p1.y,
                                    p2.x, p2.y,
                                    p3.x, p3.y,
                                    true
                                ));

                                this.updateState();

                                this.draw();
                            }}
                            onAddNoMopArea={() => {
                                const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();

                                const p0 = {
                                    x: currentCenter.x -15,
                                    y: currentCenter.y -15
                                };
                                const p1 = {
                                    x: currentCenter.x +15,
                                    y: currentCenter.y -15
                                };
                                const p2 = {
                                    x: currentCenter.x +15,
                                    y: currentCenter.y +15
                                };
                                const p3 = {
                                    x: currentCenter.x -15,
                                    y: currentCenter.y +15
                                };

                                this.structureManager.addClientStructure(new NoMopAreaClientStructure(
                                    p0.x, p0.y,
                                    p1.x, p1.y,
                                    p2.x, p2.y,
                                    p3.x, p3.y,
                                    true
                                ));

                                this.updateState();

                                this.draw();
                            }}
                            onRefresh={() => {
                                this.updateVirtualRestrictionClientStructures(true);
                                this.updateVirtualRestrictionClientStructures(false);

                                this.updateState();
                                this.draw();
                            }}
                            onClear={() => {
                                this.updateVirtualRestrictionClientStructures(true);

                                this.updateState();
                                this.draw();
                            }}
                            onSave={() => {
                                this.pendingVirtualRestrictionsStructuresUpdate = true;

                                this.props.enqueueSnackbar("Saved successfully", {
                                    preventDuplicate: true,
                                    key: "virtual_restrictions_saved",
                                    variant: "info",
                                    autoHideDuration: 1000,
                                });
                            }}
                        />
                    }
                </ActionsContainer>

                <HelpDialog
                    dialogOpen={this.state.helpDialogOpen}
                    setDialogOpen={(open: boolean) => {
                        this.setState({helpDialogOpen: open});
                    }}
                    helpText={this.props.helpText}
                />
            </MapContainer>
        );
    }
}

export default EditMap;
