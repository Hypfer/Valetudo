import React, {createRef} from "react";
import {Capability, RawMapData, RawMapEntityType} from "../api";
import {MapLayerRenderer} from "./MapLayerRenderer";
import {PathSVGDrawer} from "./PathSVGDrawer";
import {trackTransforms} from "./utils/tracked-canvas.js";
import {TouchHandler} from "./utils/touch-handling.js";
import StructureManager from "./StructureManager";
import {Box, styled} from "@mui/material";
import {ActionsContainer} from "./Styled";
import SegmentActions from "./actions/SegmentActions";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import ZoneActions from "./actions/ZoneActions";
import ZoneClientStructure from "./structures/client_structures/ZoneClientStructure";
import GoToTargetClientStructure from "./structures/client_structures/GoToTargetClientStructure";
import GoToActions from "./actions/GoToActions";

type MapProps = {
    rawMap: RawMapData;
    supportedCapabilities: {
        [Capability.MapSegmentation]: boolean,
        [Capability.ZoneCleaning]: boolean,
        [Capability.GoToLocation]: boolean
    }
};

type MapState = {
    selectedSegmentIds: Array<string>,
    zones: Array<ZoneClientStructure>,
    goToTarget: GoToTargetClientStructure | undefined
}

const Container = styled(Box)({
    position: "relative",
    height: "100%",
    width: "100%",
});

class Map extends React.Component<MapProps, MapState > {
    private readonly canvasRef: React.RefObject<HTMLCanvasElement>;
    private structureManager: StructureManager;
    private mapLayerRenderer: MapLayerRenderer;
    private ctx: any
    private canvas: HTMLCanvasElement | null;
    private readonly resizeListener: () => void;

    private drawableComponents: Array<CanvasImageSource> = [];

    private currentScaleFactor = 1;

    //TODO: understand wtf is going on there and replace with better state variables than this hack
    private touchHandlingState: any = {};

    constructor(props : MapProps) {
        super(props);

        this.canvasRef = createRef();


        this.structureManager = new StructureManager();
        this.structureManager.setPixelSize(this.props.rawMap.pixelSize);

        this.mapLayerRenderer = new MapLayerRenderer();

        this.state = {
            selectedSegmentIds: [],
            zones: [],
            goToTarget: undefined
        };


        this.resizeListener = () => {
            // Save the current transformation and recreate it
            // as the transformation state is lost when changing canvas size
            // https://stackoverflow.com/questions/48044951/canvas-state-lost-after-changing-size
            if (this.ctx !== null && this.canvas !== null) {
                const {a, b, c, d, e, f} = this.ctx.getTransform();

                this.canvas.height = this.canvas.clientHeight;
                this.canvas.width = this.canvas.clientWidth;

                this.ctx.setTransform(a, b, c, d, e, f);
                this.ctx.imageSmoothingEnabled = false;
            }


            this.draw();
        };

        this.canvas = null;
        this.ctx = null;
    }

    componentDidMount(): void {
        if (this.canvasRef.current !== null) {
            this.canvas = this.canvasRef.current;
            this.canvas.height = this.canvas.clientHeight;
            this.canvas.width = this.canvas.clientWidth;

            this.ctx = this.canvasRef.current.getContext("2d");

            if (this.ctx === null) {
                return;
            }
            trackTransforms(this.ctx);
            this.registerCanvasInteractionHandlers();
            window.addEventListener("resize", this.resizeListener);

            this.ctx.imageSmoothingEnabled = false;

            const boundingBox = {
                minX: this.props.rawMap.size.x / this.props.rawMap.pixelSize,
                minY: this.props.rawMap.size.y / this.props.rawMap.pixelSize,
                maxX: 0,
                maxY: 0
            };

            this.props.rawMap.layers.forEach(l => {
                if (l.dimensions.x.min < boundingBox.minX) {
                    boundingBox.minX = l.dimensions.x.min;
                }
                if (l.dimensions.y.min < boundingBox.minY) {
                    boundingBox.minY = l.dimensions.y.min;
                }
                if (l.dimensions.x.max > boundingBox.maxX) {
                    boundingBox.maxX = l.dimensions.x.max;
                }
                if (l.dimensions.y.max > boundingBox.maxY) {
                    boundingBox.maxY = l.dimensions.y.max;
                }
            });


            const initialScalingFactor = Math.min(
                this.canvas.width / ((boundingBox.maxX - boundingBox.minX)*1.1),
                this.canvas.height / ((boundingBox.maxY - boundingBox.minY)*1.1)
            );

            const initialxOffset = (this.canvas.width - (boundingBox.maxX - boundingBox.minX)*initialScalingFactor) / 2;
            const initialyOffset = (this.canvas.height - (boundingBox.maxY - boundingBox.minY)*initialScalingFactor) / 2;
            this.ctx.translate(initialxOffset, initialyOffset);


            this.currentScaleFactor = initialScalingFactor;

            this.ctx.scale(initialScalingFactor, initialScalingFactor);
            this.ctx.translate(-boundingBox.minX, -boundingBox.minY);


            this.updateDrawableComponents().then(() => {
                this.draw();
            });
        }
    }

    componentDidUpdate(prevProps: Readonly<MapProps>, prevState: Readonly<MapState>): void {
        if (JSON.stringify(prevProps.rawMap) !== JSON.stringify(this.props.rawMap)) { //TODO: this likely performs pretty bad
            this.structureManager.setPixelSize(this.props.rawMap.pixelSize);

            this.updateDrawableComponents().then(() => {
                this.draw();
            });
        }

    }

    componentWillUnmount(): void {
        window.removeEventListener("resize", this.resizeListener);
    }

    /*
        TODO: Split this into a LiveMap class and a base class to reuse map for editing purposes

        As far as I can tell now, this will require
        - replacing the actionsContainer content
        - overwriting updateDrawableComponents to provide filtering
        - overwriting the tap handler to not create GoTo markers
        - overwriting updateState and editing the state to make sense for the use-case

        Also, we won't need the supported capabilities in its properties
     */
    render(): JSX.Element {
        return (
            <Container>
                <canvas ref={this.canvasRef} style={{width: "100%", height: "100%"}}/>

                <ActionsContainer>
                    {
                        this.props.supportedCapabilities[Capability.MapSegmentation] &&
                        this.state.selectedSegmentIds.length > 0 &&
                        this.state.goToTarget === undefined &&

                        <SegmentActions
                            segments={this.state.selectedSegmentIds}
                            onClear={() => {
                                this.structureManager.getMapStructures().forEach(s => {
                                    if (s.type === SegmentLabelMapStructure.TYPE) {
                                        const label = s as SegmentLabelMapStructure;

                                        label.selected = false;
                                    }
                                });
                                this.updateState();

                                this.draw();
                            }}
                        />
                    }
                    {
                        this.props.supportedCapabilities[Capability.ZoneCleaning] &&
                        this.state.selectedSegmentIds.length === 0 &&
                        this.state.goToTarget === undefined &&

                        <ZoneActions
                            zones={this.state.zones}
                            convertPixelCoordinatesToCMSpace={(coordinates => {
                                return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                            })}
                            onClear={() => {
                                this.structureManager.getClientStructures().forEach(s => {
                                    if (s.type === ZoneClientStructure.TYPE) {
                                        this.structureManager.removeClientStructure(s);
                                    }
                                });

                                this.updateState();

                                this.draw();
                            }}
                            onAdd={() => {
                                //TODO: better placement
                                const p0 = this.structureManager.convertCMCoordinatesToPixelSpace({
                                    x:(this.props.rawMap.size.x/2) -64,
                                    y:(this.props.rawMap.size.y/2) -64
                                });
                                const p1 = this.structureManager.convertCMCoordinatesToPixelSpace({
                                    x:(this.props.rawMap.size.x/2) +64,
                                    y:(this.props.rawMap.size.y/2) +64
                                });

                                this.structureManager.addClientStructure(new ZoneClientStructure(
                                    p0.x, p0.y,
                                    p1.x, p1.y,
                                    true
                                ));

                                this.updateState();

                                this.draw();
                            }}
                        />
                    }
                    {
                        this.props.supportedCapabilities[Capability.GoToLocation] &&
                        this.state.goToTarget !== undefined &&

                        <GoToActions
                            goToTarget={this.state.goToTarget}
                            convertPixelCoordinatesToCMSpace={(coordinates => {
                                return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                            })}
                            onClear={() => {
                                this.structureManager.getClientStructures().forEach(s => {
                                    if (s.type === GoToTargetClientStructure.TYPE) {
                                        this.structureManager.removeClientStructure(s);
                                    }
                                });
                                this.updateState();

                                this.draw();
                            }}
                        />
                    }
                </ActionsContainer>
            </Container>
        );
    }

    private async updateDrawableComponents() {
        this.drawableComponents = [];

        this.mapLayerRenderer.draw(this.props.rawMap);
        this.drawableComponents.push(this.mapLayerRenderer.getCanvas());

        for (const entity of this.props.rawMap.entities) {
            switch (entity.type) {
                case RawMapEntityType.Path:
                case RawMapEntityType.PredictedPath: {
                    const pathImg = await PathSVGDrawer.drawPathSVG(
                        entity,
                        this.props.rawMap.size.x,
                        this.props.rawMap.size.y,
                        this.props.rawMap.pixelSize
                    );

                    this.drawableComponents.push(pathImg);

                    break;
                }
            }
        }

        this.structureManager.updateMapStructuresFromMapData(this.props.rawMap);

        this.updateState();
    }

    private updateState() {
        this.setState({
            selectedSegmentIds: this.structureManager.getMapStructures().filter(s => {
                if (s.type === SegmentLabelMapStructure.TYPE) {
                    const label = s as SegmentLabelMapStructure;

                    return label.selected;
                } else {
                    return false;
                }
            }).map(s => {
                const label = s as SegmentLabelMapStructure;

                return label.id;
            }),
            zones: this.structureManager.getClientStructures().filter(s => {
                return s.type === ZoneClientStructure.TYPE;
            }) as Array<ZoneClientStructure>,
            goToTarget: this.structureManager.getClientStructures().find(s => {
                return s.type === GoToTargetClientStructure.TYPE;
            }) as GoToTargetClientStructure | undefined
        });
    }


    private draw() {
        if (!this.ctx || !this.canvas) {
            return;
        }


        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        this.drawableComponents.forEach(c => {
            this.ctx.drawImage(c, 0, 0);
        });


        /**
         * Carries out a drawing routine on the canvas with resetting the scaling / translation of the canvas
         * and restoring it afterwards.
         * This allows for drawing equally thick lines no matter what the zoomlevel of the canvas currently is.
         *
         */
        const transformationMatrixToMapSpace = this.ctx.getTransform();
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.structureManager.getMapStructures().forEach(s => {
            s.draw(this.ctx, transformationMatrixToMapSpace, this.currentScaleFactor);
        });

        this.structureManager.getClientStructures().forEach(s => {
            s.draw(this.ctx, transformationMatrixToMapSpace, this.currentScaleFactor);
        });

        this.ctx.restore();
    }

    private registerCanvasInteractionHandlers() {
        if (this.canvas === null || this.ctx === null) {
            return;
        }
        //eslint-disable-next-line no-new
        new TouchHandler(this.canvas);


        this.touchHandlingState.lastX = this.canvas.width / 2;
        this.touchHandlingState.lastY = this.canvas.height / 2;

        const startTranslate = (evt: any) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }

            const {x, y} = relativeCoordinates(evt.coordinates, this.canvas);
            this.touchHandlingState.lastX = x;
            this.touchHandlingState.lastY = y;
            this.touchHandlingState.dragStart = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        };

        const moveTranslate = (evt: any) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }

            const {x, y} = relativeCoordinates(evt.currentCoordinates, this.canvas);
            const oldX = this.touchHandlingState.lastX;
            const oldY = this.touchHandlingState.lastY;
            this.touchHandlingState.lastX = x;
            this.touchHandlingState.lastY = y;

            if (this.touchHandlingState.dragStart) {

                const currentTransform = this.ctx.getTransform();
                const invertedCurrentTransform = DOMMatrix.fromMatrix(this.ctx.getTransform()).invertSelf();

                const wasHandled = this.structureManager.getClientStructures().some(structure => {
                    const result = structure.translate(
                        this.touchHandlingState.dragStart.matrixTransform(invertedCurrentTransform),
                        {x: oldX, y: oldY},
                        {x, y},
                        currentTransform
                    );

                    if (result.stopPropagation) {
                        if (result.deleteMe === true) {
                            this.structureManager.removeMapStructure(structure);
                        }


                        this.updateState();

                        this.draw();

                        return true;
                    } else {
                        return false;
                    }
                });

                if (wasHandled) {
                    return;
                }

                // If no location stopped event handling -> pan the whole map
                const pt = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
                this.ctx.translate(pt.x - this.touchHandlingState.dragStart.x, pt.y - this.touchHandlingState.dragStart.y);
                this.draw();
            }
        };

        const endTranslate = (evt: any) => {
            this.touchHandlingState.dragStart = null;


            this.structureManager.getClientStructures().forEach(structure => {
                if (structure.isResizing) {
                    structure.isResizing = false;
                }


                structure.postProcess();
            });

            this.draw();
        };

        const startPinch = (evt: any) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }
            this.touchHandlingState.lastScaleFactor = 1;

            // translate
            const {x, y} = relativeCoordinates(evt.center, this.canvas);
            this.touchHandlingState.lastX = x;
            this.touchHandlingState.lastY = y;
            this.touchHandlingState.dragStart = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        };

        const endPinch = (evt: any) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }

            const [scaleX] = this.ctx.getScaleFactor2d();
            this.currentScaleFactor = scaleX;
            endTranslate(evt);
        };

        const scalePinch = (evt: any) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }

            const currentScaleFactor = this.ctx.getScaleFactor2d()[0];
            const factor = evt.scale / this.touchHandlingState.lastScaleFactor;

            if (factor * currentScaleFactor < 0.4 && factor < 1) {
                return;
            } else if (factor * currentScaleFactor > 150 && factor > 1) {
                return;
            }

            this.touchHandlingState.lastScaleFactor = evt.scale;

            const pt = this.ctx.transformedPoint(evt.center.x, evt.center.y);
            this.ctx.translate(pt.x, pt.y);
            this.ctx.scale(factor, factor);
            this.ctx.translate(-pt.x, -pt.y);

            // translate
            const {x, y} = relativeCoordinates(evt.center, this.canvas);
            this.touchHandlingState.lastX = x;
            this.touchHandlingState.lastY = y;
            const p = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
            this.ctx.translate(p.x - this.touchHandlingState.dragStart.x, p.y - this.touchHandlingState.dragStart.y);

            this.draw();
        };

        const tap = (evt: any) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }

            const currentTransform = this.ctx.getTransform();

            const {x, y} = relativeCoordinates(evt.tappedCoordinates, this.canvas);
            const tappedPointInMapSpace = this.ctx.transformedPoint(x, y);
            const tappedPointInScreenSpace = new DOMPoint(tappedPointInMapSpace.x, tappedPointInMapSpace.y).matrixTransform(currentTransform);

            const clientStructuresHandledTap = this.structureManager.getClientStructures().some(structure => {
                const result = structure.tap(tappedPointInScreenSpace, currentTransform);

                if (result.stopPropagation) {
                    if (result.deleteMe === true) {
                        this.structureManager.removeClientStructure(structure);
                    }


                    this.updateState();

                    this.draw();

                    return true;
                } else {
                    return false;
                }
            });

            if (clientStructuresHandledTap) {
                return;
            }

            const mapStructuresHandledTap = this.structureManager.getMapStructures().some(structure => {
                const result = structure.tap(tappedPointInScreenSpace, currentTransform);

                if (result.stopPropagation) {
                    if (result.deleteMe === true) {
                        this.structureManager.removeMapStructure(structure);
                    }


                    this.updateState();

                    this.draw();

                    return true;
                } else {
                    return false;
                }
            });

            if (mapStructuresHandledTap) {
                return;
            }

            //only draw if any structure was changed
            let didUpdateStructures = false;
            this.structureManager.getClientStructures().forEach(s => {
                if (s.active) {
                    didUpdateStructures = true;
                }
                s.active = false;
            });

            if (didUpdateStructures) {
                this.draw();
            }


            if (this.props.supportedCapabilities[Capability.GoToLocation]) {
                this.structureManager.getClientStructures().forEach(s => {
                    if (s.type === GoToTargetClientStructure.TYPE) {
                        this.structureManager.removeClientStructure(s);
                    }
                });

                if (this.structureManager.getClientStructures().length === 0 && this.state.selectedSegmentIds.length === 0) {
                    this.structureManager.addClientStructure(new GoToTargetClientStructure(tappedPointInMapSpace.x, tappedPointInMapSpace.y));

                    this.updateState();
                    this.draw();
                }
            }
        };





        this.canvas.addEventListener("tap", tap);
        this.canvas.addEventListener("panstart", startTranslate);
        this.canvas.addEventListener("panmove", moveTranslate);
        this.canvas.addEventListener("panend", endTranslate);
        this.canvas.addEventListener("pinchstart", startPinch);
        this.canvas.addEventListener("pinchmove", scalePinch);
        this.canvas.addEventListener("pinchend", endPinch);


        /**
         * Handles zooming by using the mousewheel.
         *
         * @param {WheelEvent} evt
         */
        const handleScroll = (evt: WheelEvent) => {
            if (this.canvas === null || this.ctx === null) {
                return;
            }

            const factor = evt.deltaY > 0 ? 3 / 4 : 4 / 3;
            const currentScaleFactor = this.ctx.getScaleFactor2d()[0];

            if (factor * currentScaleFactor < 0.4 && factor < 1) {
                return;
            } else if (factor * currentScaleFactor > 150 && factor > 1) {
                return;
            }

            const pt = this.ctx.transformedPoint(evt.offsetX, evt.offsetY);
            this.ctx.translate(pt.x, pt.y);
            this.ctx.scale(factor, factor);
            this.ctx.translate(-pt.x, -pt.y);

            const [scaleX] = this.ctx.getScaleFactor2d();
            this.currentScaleFactor = scaleX;

            this.draw();

            return evt.preventDefault();
        };

        this.canvas.addEventListener("wheel", handleScroll, false);
    }
}

/**
 * Helper function for calculating coordinates relative to an HTML Element
 *
 * @param {{x: number, y: number}} "{x, y}" - the absolute screen coordinates (clicked)
 * @param {*} referenceElement - the element (e.g. a canvas) to which
 * relative coordinates should be calculated
 * @returns {{x: number, y: number}} coordinates relative to the referenceElement
 */
function relativeCoordinates({x, y}: {x: number, y:number}, referenceElement: HTMLElement) {
    const rect = referenceElement.getBoundingClientRect();
    return {
        x: x - rect.left,
        y: y - rect.top
    };
}


export default Map;
