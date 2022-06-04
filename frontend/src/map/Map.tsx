import React, {createRef} from "react";
import {RawMapData, RawMapEntityType} from "../api";
import {MapLayerRenderer} from "./MapLayerRenderer";
import {PathDrawer} from "./PathDrawer";
import {trackTransforms} from "./utils/tracked-canvas.js";
import {TouchHandler} from "./utils/touch-handling.js";
import StructureManager from "./StructureManager";
import {Box, styled, Theme} from "@mui/material";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import semaphore from "semaphore";
import {convertNumberToRoman} from "../utils";

export interface MapProps {
    rawMap: RawMapData;
    theme: Theme;
    trackSegmentSelectionOrder?: boolean;
}

export interface MapState {
    selectedSegmentIds: Array<string>
}

const Container = styled(Box)({
    position: "relative",
    height: "100%",
    width: "100%",
});

const SCROLL_PARAMETERS = {
    ZOOM_IN_MULTIPLIER: 4/3 - 1,
    ZOOM_OUT_MULTIPLIER: 1 - 3/4,
    PIXELS_PER_FULL_STEP: 100
};

class Map<P, S> extends React.Component<P & MapProps, S & MapState > {
    protected readonly canvasRef: React.RefObject<HTMLCanvasElement>;
    protected structureManager: StructureManager;
    protected mapLayerRenderer: MapLayerRenderer;
    protected canvas!: HTMLCanvasElement;
    protected ctx!: CanvasRenderingContext2D | any; //the | any is only here because the tracked-canvas.js extends the ctx object
    protected readonly resizeListener: () => void;
    protected readonly visibilityStateChangeListener: () => void;

    protected drawableComponents: Array<CanvasImageSource> = [];
    protected drawableComponentsMutex: semaphore.Semaphore = semaphore(1); //Required to sync up with the render webWorker

    protected currentScaleFactor = 1;

    //TODO: understand wtf is going on there and replace with better state variables than this hack
    protected touchHandlingState: any = {};


    protected activeTouchEvent = false;
    protected activeScrollEvent = false;
    protected pendingInternalDrawableStateUpdate = false;
    protected scrollTimeout: NodeJS.Timeout | undefined;


    constructor(props : MapProps) {
        super(props as Readonly<P & MapProps>);

        this.canvasRef = createRef();


        this.structureManager = new StructureManager();
        this.structureManager.setPixelSize(this.props.rawMap.pixelSize);

        this.mapLayerRenderer = new MapLayerRenderer();

        this.state = {
            selectedSegmentIds: [] as Array<string>
        } as Readonly<S & MapState>;


        this.resizeListener = () => {
            // Save the current transformation and recreate it
            // as the transformation state is lost when changing canvas size
            // https://stackoverflow.com/questions/48044951/canvas-state-lost-after-changing-size
            const {a, b, c, d, e, f} = this.ctx.getTransform();

            //Ignore weirdness related to the URL bar on Firefox mobile
            if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
                return;
            }

            this.canvas.height = this.canvas.clientHeight;
            this.canvas.width = this.canvas.clientWidth;

            this.ctx.setTransform(a, b, c, d, e, f);


            this.draw();
        };

        this.visibilityStateChangeListener = () => {
            if (this.pendingInternalDrawableStateUpdate && document.visibilityState === "visible") {
                this.pendingInternalDrawableStateUpdate = false;

                this.updateInternalDrawableState();
            }
        };
    }

    componentDidMount(): void {
        this.canvas = this.canvasRef.current!;
        this.canvas.height = this.canvas.clientHeight;
        this.canvas.width = this.canvas.clientWidth;

        this.ctx = this.canvas.getContext("2d")!;

        trackTransforms(this.ctx);
        this.registerCanvasInteractionHandlers();
        window.addEventListener("resize", this.resizeListener);
        document.addEventListener("visibilitychange", this.visibilityStateChangeListener);

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


        this.updateInternalDrawableState();
    }

    componentDidUpdate(prevProps: Readonly<MapProps>, prevState: Readonly<MapState>): void {
        if (prevProps.rawMap.metaData.nonce !== this.props.rawMap.metaData.nonce) {
            this.onMapUpdate();

            /**
             * If we're not visible, we do not need to render map updates as no one would see those anyway
             * We also cannot update the map data while someone interacts with it as that causes jank
             */
            if (
                document.visibilityState !== "visible" ||
                this.activeTouchEvent ||
                this.activeScrollEvent
            ) {
                this.pendingInternalDrawableStateUpdate = true;
            } else {
                this.updateInternalDrawableState();
            }
        } else if (this.props.theme.palette.mode !== prevProps.theme.palette.mode) {
            this.updateInternalDrawableState();
        }
    }

    protected onMapUpdate() : void {
        //This can be overridden to do something when the map is updated with a new one
    }

    componentWillUnmount(): void {
        window.removeEventListener("resize", this.resizeListener);
        document.removeEventListener("visibilitychange", this.visibilityStateChangeListener);
    }

    protected updateInternalDrawableState() : void {
        this.structureManager.setPixelSize(this.props.rawMap.pixelSize);

        this.updateDrawableComponents().then(() => {
            this.draw();
        });
    }

    render(): JSX.Element {
        return (
            <Container style={{overflow: "hidden"}}>
                <canvas
                    ref={this.canvasRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        imageRendering: "crisp-edges"
                    }}
                />
                {this.renderAdditionalElements()}
            </Container>
        );
    }

    protected renderAdditionalElements() : JSX.Element {
        return <></>;
    }

    protected updateDrawableComponents(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.drawableComponentsMutex.take(async () => {
                this.drawableComponents = [];

                await this.mapLayerRenderer.draw(this.props.rawMap, this.props.theme);
                this.drawableComponents.push(this.mapLayerRenderer.getCanvas());

                const pathsImage = await PathDrawer.drawPaths(
                    this.props.rawMap.entities.filter(e => {
                        return e.type === RawMapEntityType.Path || e.type === RawMapEntityType.PredictedPath;
                    }),
                    this.props.rawMap.size.x,
                    this.props.rawMap.size.y,
                    this.props.rawMap.pixelSize,
                    this.props.theme
                );

                this.drawableComponents.push(pathsImage);

                this.structureManager.updateMapStructuresFromMapData(this.props.rawMap);

                this.updateState();

                this.drawableComponentsMutex.leave();

                resolve();
            });
        });
    }

    protected updateState() : void {
        const currentSegmentLabelStructures = this.structureManager.getMapStructures().filter(s => {
            return s.type === SegmentLabelMapStructure.TYPE;
        }) as Array<SegmentLabelMapStructure>;

        const previouslySelectedSegmentIds = this.state.selectedSegmentIds;
        const currentlySelectedSegmentIds = currentSegmentLabelStructures.filter(s => {
            return s.selected;
        }).map(s => {
            return s.id;
        });

        // This ensures that we keep the order in which segments were selected by the user
        const updatedSelectedSegmentIds = [
            ...previouslySelectedSegmentIds.filter(id => { //Take existing ones excluding those, which aren't selected anymore
                return currentlySelectedSegmentIds.includes(id);
            }),
            ...currentlySelectedSegmentIds.filter(id => { //Append all IDs that weren't part of the previous array
                return !previouslySelectedSegmentIds.includes(id);
            })
        ];

        if (this.props.trackSegmentSelectionOrder === true) {
            currentSegmentLabelStructures.forEach(s => {
                const idx = updatedSelectedSegmentIds.indexOf(s.id);

                if (idx >= 0) {
                    s.topLabel = convertNumberToRoman(idx + 1);
                } else {
                    s.topLabel = undefined;
                }
            });
        }

        this.setState({
            selectedSegmentIds: updatedSelectedSegmentIds,
        } as S & MapState);
    }


    protected draw() : void {
        window.requestAnimationFrame(() => {
            this.drawableComponentsMutex.take(() => {

                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();


                this.ctx.imageSmoothingEnabled = false;

                this.drawableComponents.forEach(c => {
                    this.ctx.drawImage(c, 0, 0);
                });

                this.ctx.imageSmoothingEnabled = true;


                /**
                 * Carries out a drawing routine on the canvas with resetting the scaling / translation of the canvas
                 * and restoring it afterwards.
                 * This allows for drawing equally thick lines no matter what the zoomlevel of the canvas currently is.
                 *
                 */
                const transformationMatrixToScreenSpace = this.ctx.getTransform();
                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);

                this.structureManager.getMapStructures().forEach(s => {
                    s.draw(
                        this.ctx,
                        transformationMatrixToScreenSpace,
                        this.currentScaleFactor,
                        this.structureManager.getPixelSize()
                    );
                });

                this.structureManager.getClientStructures().forEach(s => {
                    s.draw(
                        this.ctx,
                        transformationMatrixToScreenSpace,
                        this.currentScaleFactor,
                        this.structureManager.getPixelSize()
                    );
                });

                this.ctx.restore();
                this.drawableComponentsMutex.leave();
            });
        });
    }

    protected getCurrentViewportCenterCoordinatesInPixelSpace() : {x: number, y: number} {
        return this.ctx.transformedPoint(this.canvas.width/2, this.canvas.height/2);
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected onTap(evt: any) : boolean | void {
        const currentTransform = this.ctx.getTransform();

        const {x, y} = Map.relativeCoordinates(evt.tappedCoordinates, this.canvas);
        const tappedPointInMapSpace = this.ctx.transformedPoint(x, y);
        const tappedPointInScreenSpace = new DOMPoint(tappedPointInMapSpace.x, tappedPointInMapSpace.y).matrixTransform(currentTransform);
        let drawRequested = false;

        const clientStructuresHandledTap = this.structureManager.getClientStructures().some(structure => {
            const result = structure.tap(tappedPointInScreenSpace, currentTransform);

            if (result.requestDraw === true) {
                drawRequested = true;
            }

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
            return true;
        }

        const mapStructuresHandledTap = this.structureManager.getMapStructures().some(structure => {
            const result = structure.tap(tappedPointInScreenSpace, currentTransform);

            if (result.requestDraw === true) {
                drawRequested = true;
            }

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
            return true;
        }

        //only draw if any structure was changed
        let didUpdateStructures = false;
        this.structureManager.getClientStructures().forEach(s => {
            if (s.active) {
                didUpdateStructures = true;
            }
            s.active = false;
        });

        if (didUpdateStructures || drawRequested) {
            this.draw();
        }
    }

    protected onScroll(evt: WheelEvent) : void {
        this.activeScrollEvent = true;
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
            this.activeScrollEvent = false;

            if (this.pendingInternalDrawableStateUpdate && !this.activeTouchEvent) {
                this.pendingInternalDrawableStateUpdate = false;
                this.updateInternalDrawableState();
            }
        }, 250);


        const fullStep = evt.deltaY < 0 ? SCROLL_PARAMETERS.ZOOM_IN_MULTIPLIER : SCROLL_PARAMETERS.ZOOM_OUT_MULTIPLIER;
        const factor = 1 - (fullStep * (evt.deltaY / SCROLL_PARAMETERS.PIXELS_PER_FULL_STEP));

        const currentScaleFactor = this.ctx.getScaleFactor2d()[0];

        if (
            (factor * currentScaleFactor < 0.4 && factor < 1) ||
            (factor * currentScaleFactor > 150 && factor > 1)
        ) {
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
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected startTranslate(evt: any) : void {
        const {x, y} = Map.relativeCoordinates(evt.coordinates, this.canvas);
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;
        this.touchHandlingState.dragStart = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        this.activeTouchEvent = true;
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected moveTranslate(evt: any) : void {
        const {x, y} = Map.relativeCoordinates(evt.currentCoordinates, this.canvas);
        const oldX = this.touchHandlingState.lastX;
        const oldY = this.touchHandlingState.lastY;
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;

        if (this.touchHandlingState.dragStart) {

            const currentTransform = this.ctx.getTransform();
            const currentPixelSize = this.structureManager.getPixelSize();
            const invertedCurrentTransform = DOMMatrix.fromMatrix(this.ctx.getTransform()).invertSelf();

            const wasHandled = this.structureManager.getClientStructures().some(structure => {
                const result = structure.translate(
                    this.touchHandlingState.dragStart.matrixTransform(invertedCurrentTransform),
                    {x: oldX, y: oldY},
                    {x, y},
                    currentTransform,
                    currentPixelSize
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
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected endTranslate(evt: any) : void {
        this.activeTouchEvent = false;
        this.touchHandlingState.dragStart = null;


        this.structureManager.getClientStructures().forEach(structure => {
            if (structure.isResizing) {
                structure.isResizing = false;
            }


            structure.postProcess();
        });

        this.draw();

        if (this.pendingInternalDrawableStateUpdate && !this.activeScrollEvent) {
            this.pendingInternalDrawableStateUpdate = false;
            this.updateInternalDrawableState();
        }
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected startPinch(evt: any) : void {
        this.touchHandlingState.lastScaleFactor = 1;

        // translate
        const {x, y} = Map.relativeCoordinates(evt.center, this.canvas);
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;
        this.touchHandlingState.dragStart = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        this.activeTouchEvent = true;
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected endPinch(evt: any) : void {
        const [scaleX] = this.ctx.getScaleFactor2d();
        this.currentScaleFactor = scaleX;
        this.endTranslate(evt);
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected scalePinch(evt: any) : any {
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
        const {x, y} = Map.relativeCoordinates(evt.center, this.canvas);
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;
        const p = this.ctx.transformedPoint(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        this.ctx.translate(p.x - this.touchHandlingState.dragStart.x, p.y - this.touchHandlingState.dragStart.y);

        this.draw();
    }

    protected registerCanvasInteractionHandlers(): void {
        const touchHandler = new TouchHandler();
        touchHandler.registerListeners(this.canvas);

        this.touchHandlingState.lastX = this.canvas.width / 2;
        this.touchHandlingState.lastY = this.canvas.height / 2;


        this.canvas.addEventListener("tap", this.onTap.bind(this));
        this.canvas.addEventListener("panstart", this.startTranslate.bind(this));
        this.canvas.addEventListener("panmove", this.moveTranslate.bind(this));
        this.canvas.addEventListener("panend", this.endTranslate.bind(this));
        this.canvas.addEventListener("pinchstart", this.startPinch.bind(this));
        this.canvas.addEventListener("pinchmove", this.scalePinch.bind(this));
        this.canvas.addEventListener("pinchend", this.endPinch.bind(this));

        //Order might be important here but I've never tested that
        this.canvas.addEventListener("wheel", this.onScroll.bind(this), false);
    }

    /**
     * Helper function for calculating coordinates relative to an HTML Element
     *
     * @param {{x: number, y: number}} "{x, y}" - the absolute screen coordinates (clicked)
     * @param {*} referenceElement - the element (e.g. a canvas) to which
     * relative coordinates should be calculated
     * @returns {{x: number, y: number}} coordinates relative to the referenceElement
     */
    protected static relativeCoordinates({x, y}: {x: number, y:number}, referenceElement: HTMLElement) : {x: number, y: number} {
        const rect = referenceElement.getBoundingClientRect();
        return {
            x: x - rect.left,
            y: y - rect.top
        };
    }
}


export default Map;
