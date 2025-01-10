import React, {createRef} from "react";
import {RawMapData, RawMapEntityType} from "../api";
import {MapLayerManager} from "./MapLayerManager";
import {PathDrawer} from "./PathDrawer";
import {TouchHandler} from "./utils/touch_handling/TouchHandler";
import StructureManager from "./StructureManager";
import {Box, styled, Theme} from "@mui/material";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import semaphore from "semaphore";
import {convertNumberToRoman} from "../utils";
import {Canvas2DContextTrackingWrapper} from "./utils/Canvas2DContextTrackingWrapper";
import {TapTouchHandlerEvent} from "./utils/touch_handling/events/TapTouchHandlerEvent";
import {PanStartTouchHandlerEvent} from "./utils/touch_handling/events/PanStartTouchHandlerEvent";
import {PanMoveTouchHandlerEvent} from "./utils/touch_handling/events/PanMoveTouchHandlerEvent";
import {PanEndTouchHandlerEvent} from "./utils/touch_handling/events/PanEndTouchHandlerEvent";
import {PinchStartTouchHandlerEvent} from "./utils/touch_handling/events/PinchStartTouchHandlerEvent";
import {PinchMoveTouchHandlerEvent} from "./utils/touch_handling/events/PinchMoveTouchHandlerEvent";
import {PinchEndTouchHandlerEvent} from "./utils/touch_handling/events/PinchEndTouchHandlerEvent";
import {PointCoordinates} from "./utils/types";
import { create } from "zustand";
import {clampMapScalingFactorFactor, considerHiDPI} from "./utils/helpers";

export interface MapProps {
    rawMap: RawMapData;
    theme: Theme;
    trackSegmentSelectionOrder?: boolean;
}

export interface MapState {
    selectedSegmentIds: Array<string>,
    dialogOpen: boolean,
    dialogTitle: string,
    dialogBody: string | React.ReactElement,
}

export const usePendingMapAction = create<{
    hasPendingMapAction: boolean
}>()(() => {
    return {
        hasPendingMapAction: false
    };
});

export const MapContainer = styled(Box)({
    position: "relative",
    height: "100%",
    width: "100%",
});

const SCROLL_PARAMETERS = {
    ZOOM_MULTIPLIER: 1/4,
    PIXELS_PER_FULL_STEP: 100
};

abstract class Map<P, S> extends React.Component<P & MapProps, S & MapState > {
    protected readonly canvasRef: React.RefObject<HTMLCanvasElement>;
    protected structureManager: StructureManager;
    protected mapLayerManager: MapLayerManager;
    protected canvas!: HTMLCanvasElement;
    protected ctxWrapper!: Canvas2DContextTrackingWrapper;
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


    protected constructor(props : MapProps) {
        super(props as Readonly<P & MapProps>);

        this.canvasRef = createRef();


        this.structureManager = new StructureManager();
        this.structureManager.setPixelSize(this.props.rawMap.pixelSize);

        this.mapLayerManager = new MapLayerManager();

        this.state = {
            selectedSegmentIds: [] as Array<string>,
            dialogOpen: false,
            dialogTitle: "Hello World",
            dialogBody: "This should never be visible",
        } as Readonly<S & MapState>;


        this.resizeListener = () => {
            // Save the current transformation and recreate it
            // as the transformation state is lost when changing canvas size
            // https://stackoverflow.com/questions/48044951/canvas-state-lost-after-changing-size
            const {a, b, c, d, e, f} = this.ctxWrapper.getTransform();

            //Ignore weirdness related to the URL bar on Firefox mobile
            if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
                return;
            }

            this.canvas.height = considerHiDPI(this.canvas.clientHeight);
            this.canvas.width = considerHiDPI(this.canvas.clientWidth);

            this.ctxWrapper.setTransform(a, b, c, d, e, f);


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
        this.canvas.height = considerHiDPI(this.canvas.clientHeight);
        this.canvas.width = considerHiDPI(this.canvas.clientWidth);

        this.ctxWrapper = new Canvas2DContextTrackingWrapper(this.canvas.getContext("2d")!);

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
        this.ctxWrapper.translate(initialxOffset, initialyOffset);


        this.currentScaleFactor = initialScalingFactor;

        this.ctxWrapper.scale(initialScalingFactor, initialScalingFactor);
        this.ctxWrapper.translate(-boundingBox.minX, -boundingBox.minY);


        this.updateInternalDrawableState();

        usePendingMapAction.setState({hasPendingMapAction: false});
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

        usePendingMapAction.setState({hasPendingMapAction: false});
    }

    protected updateInternalDrawableState() : void {
        this.structureManager.setPixelSize(this.props.rawMap.pixelSize);

        this.updateDrawableComponents().then(() => {
            this.draw();
        }).catch(() => {
            /* intentional */
        });
    }

    protected redrawLayers() : void {
        this.mapLayerManager.draw(this.props.rawMap, this.props.theme).then(() => {
            this.draw();
        }).catch(() => {
            /* intentional */
        });
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

        const pathsImage = await PathDrawer.drawPaths( {
            pathMapEntities: this.props.rawMap.entities.filter(e => {
                return e.type === RawMapEntityType.Path || e.type === RawMapEntityType.PredictedPath;
            }),
            mapWidth: this.props.rawMap.size.x,
            mapHeight: this.props.rawMap.size.y,
            pixelSize: this.props.rawMap.pixelSize,
            paletteMode: this.props.theme.palette.mode,
        });

        this.drawableComponents.push(pathsImage);

        this.structureManager.updateMapStructuresFromMapData(this.props.rawMap);

        this.updateState();

        this.drawableComponentsMutex.leave();
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

        this.mapLayerManager.setSelectedSegmentIds(updatedSelectedSegmentIds);

        this.setState({
            selectedSegmentIds: updatedSelectedSegmentIds,
        } as S & MapState);
    }


    protected draw() : void {
        window.requestAnimationFrame(() => {
            this.drawableComponentsMutex.take(() => {
                const ctx = this.ctxWrapper.getContext();

                this.ctxWrapper.save();
                this.ctxWrapper.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctxWrapper.restore();


                ctx.imageSmoothingEnabled = false;

                this.drawableComponents.forEach(c => {
                    ctx.drawImage(c, 0, 0);
                });

                ctx.imageSmoothingEnabled = true;


                /**
                 * Carries out a drawing routine on the canvas with resetting the scaling / translation of the canvas
                 * and restoring it afterwards.
                 * This allows for drawing equally thick lines no matter what the zoomlevel of the canvas currently is.
                 *
                 */
                const transformationMatrixToScreenSpace = this.ctxWrapper.getTransform();
                this.ctxWrapper.save();
                this.ctxWrapper.setTransform(1, 0, 0, 1, 0, 0);

                this.structureManager.getMapStructures().forEach(s => {
                    s.draw(
                        this.ctxWrapper,
                        transformationMatrixToScreenSpace,
                        this.currentScaleFactor,
                        this.structureManager.getPixelSize()
                    );
                });

                this.structureManager.getClientStructures().forEach(s => {
                    s.draw(
                        this.ctxWrapper,
                        transformationMatrixToScreenSpace,
                        this.currentScaleFactor,
                        this.structureManager.getPixelSize()
                    );
                });

                this.ctxWrapper.restore();
                this.drawableComponentsMutex.leave();
            });
        });
    }

    protected getCurrentViewportCenterCoordinatesInPixelSpace() : PointCoordinates {
        return this.ctxWrapper.mapPointToCurrentTransform(this.canvas.width/2, this.canvas.height/2);
    }

    protected onTap(evt: TapTouchHandlerEvent) : boolean | void {
        const currentTransform = this.ctxWrapper.getTransform();

        const {x, y} = this.relativeCoordinatesToCanvas(evt.x0, evt.y0);
        const tappedPointInMapSpace = this.ctxWrapper.mapPointToCurrentTransform(x, y);
        const tappedPointInScreenSpace = new DOMPoint(tappedPointInMapSpace.x, tappedPointInMapSpace.y).matrixTransform(currentTransform);
        let drawRequested = false;

        const clientStructuresHandledTap = this.structureManager.getClientStructures().some(structure => {
            const result = structure.tap(tappedPointInScreenSpace, currentTransform);

            if (result.requestDraw === true) {
                drawRequested = true;
            }

            if (result.openDialog) {
                this.setState(prevState => {
                    return {
                        ...prevState,

                        dialogOpen: true,
                        dialogTitle: result.openDialog!.title,
                        dialogBody: result.openDialog!.body
                    };
                });
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

            if (result.openDialog) {
                this.setState(prevState => {
                    return {
                        ...prevState,

                        dialogOpen: true,
                        dialogTitle: result.openDialog!.title,
                        dialogBody: result.openDialog!.body
                    };
                });
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

        const scaledPixels = evt.deltaY * (SCROLL_PARAMETERS.ZOOM_MULTIPLIER / SCROLL_PARAMETERS.PIXELS_PER_FULL_STEP);
        let factor;
        if (evt.deltaY < 0) {
            factor = 1 / (1 + scaledPixels);
        } else {
            factor = 1 - scaledPixels;
        }

        const { scaleX: currentScaleFactor } = this.ctxWrapper.getScaleFactor();

        factor = clampMapScalingFactorFactor(currentScaleFactor, factor);

        const pt = this.ctxWrapper.mapPointToCurrentTransform(
            considerHiDPI(evt.offsetX),
            considerHiDPI(evt.offsetY),
        );
        this.ctxWrapper.translate(pt.x, pt.y);
        this.ctxWrapper.scale(factor, factor);
        this.ctxWrapper.translate(-pt.x, -pt.y);

        this.updateScaleFactor();
        this.draw();

        return evt.preventDefault();
    }


    protected startTranslate(evt: PanStartTouchHandlerEvent) : void {
        const {x, y} = this.relativeCoordinatesToCanvas(evt.x0, evt.y0);
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;
        this.touchHandlingState.dragStart = this.ctxWrapper.mapPointToCurrentTransform(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        this.activeTouchEvent = true;
    }

    protected moveTranslate(evt: PanMoveTouchHandlerEvent) : void {
        const {x, y} = this.relativeCoordinatesToCanvas(evt.x1,evt.y1);
        const oldX = this.touchHandlingState.lastX;
        const oldY = this.touchHandlingState.lastY;
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;

        if (this.touchHandlingState.dragStart) {

            const currentTransform = this.ctxWrapper.getTransform();
            const currentPixelSize = this.structureManager.getPixelSize();
            const invertedCurrentTransform = this.ctxWrapper.getTransform().invertSelf();

            const wasHandled = this.structureManager.getClientStructures().some(structure => {
                const result = structure.translate(
                    this.touchHandlingState.dragStart.matrixTransform(invertedCurrentTransform),
                    {x: oldX, y: oldY},
                    {x: x, y: y},
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
            const pt = this.ctxWrapper.mapPointToCurrentTransform(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
            this.ctxWrapper.translate(pt.x - this.touchHandlingState.dragStart.x, pt.y - this.touchHandlingState.dragStart.y);
            this.draw();
        }
    }

    protected endTranslate(evt: PanEndTouchHandlerEvent | PinchEndTouchHandlerEvent) : void {
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

    protected startPinch(evt: PinchStartTouchHandlerEvent) : void {
        this.touchHandlingState.lastScaleFactor = 1;

        // translate
        const {x, y} = this.relativeCoordinatesToCanvas(evt.x0, evt.y0);
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;
        this.touchHandlingState.dragStart = this.ctxWrapper.mapPointToCurrentTransform(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        this.activeTouchEvent = true;
    }

    protected scalePinch(evt: PinchMoveTouchHandlerEvent) : any {
        const { scaleX: currentScaleFactor } = this.ctxWrapper.getScaleFactor();
        let factor = evt.scale / this.touchHandlingState.lastScaleFactor;

        factor = clampMapScalingFactorFactor(currentScaleFactor, factor);

        this.touchHandlingState.lastScaleFactor = evt.scale;

        const pt = this.ctxWrapper.mapPointToCurrentTransform(evt.x0, evt.y0);
        this.ctxWrapper.translate(pt.x, pt.y);
        this.ctxWrapper.scale(factor, factor);
        this.ctxWrapper.translate(-pt.x, -pt.y);

        // translate
        const {x, y} = this.relativeCoordinatesToCanvas(evt.x0, evt.y0);
        this.touchHandlingState.lastX = x;
        this.touchHandlingState.lastY = y;
        const p = this.ctxWrapper.mapPointToCurrentTransform(this.touchHandlingState.lastX, this.touchHandlingState.lastY);
        this.ctxWrapper.translate(p.x - this.touchHandlingState.dragStart.x, p.y - this.touchHandlingState.dragStart.y);

        this.updateScaleFactor();
        this.draw();
    }

    protected endPinch(evt: PinchEndTouchHandlerEvent) : void {
        this.updateScaleFactor();

        this.endTranslate(evt);
    }

    protected registerCanvasInteractionHandlers(): void {
        const touchHandler = new TouchHandler(this.canvas);

        this.touchHandlingState.lastX = this.canvas.width / 2;
        this.touchHandlingState.lastY = this.canvas.height / 2;


        touchHandler.addEventListener(TapTouchHandlerEvent.TYPE, evt => {
            this.onTap(evt as TapTouchHandlerEvent);
        });

        touchHandler.addEventListener(PanStartTouchHandlerEvent.TYPE, evt => {
            this.startTranslate(evt as PanStartTouchHandlerEvent);
        });
        touchHandler.addEventListener(PanMoveTouchHandlerEvent.TYPE, evt => {
            this.moveTranslate(evt as PanMoveTouchHandlerEvent);
        });
        touchHandler.addEventListener(PanEndTouchHandlerEvent.TYPE, evt => {
            this.endTranslate(evt as PanEndTouchHandlerEvent);
        });

        touchHandler.addEventListener(PinchStartTouchHandlerEvent.TYPE, evt => {
            this.startPinch(evt as PinchStartTouchHandlerEvent);
        });
        touchHandler.addEventListener(PinchMoveTouchHandlerEvent.TYPE, evt => {
            this.scalePinch(evt as PinchMoveTouchHandlerEvent);
        });
        touchHandler.addEventListener(PinchEndTouchHandlerEvent.TYPE, evt => {
            this.endPinch(evt as PinchEndTouchHandlerEvent);
        });

        //Order might be important here but I've never tested that
        this.canvas.addEventListener("wheel", this.onScroll.bind(this), false);
    }

    /**
     * Helper function for calculating coordinates relative to an HTML Element
     *
     * @param {number} x absolute screen coordinates x
     * @param {number} y absolute screen coordinates y
     *
     * @returns {{x: number, y: number}} coordinates relative to the canvas element
     */
    protected relativeCoordinatesToCanvas(x: number, y:number) : PointCoordinates {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: considerHiDPI(x - rect.left),
            y: considerHiDPI(y - rect.top)
        };
    }

    private updateScaleFactor() {
        const { scaleX } = this.ctxWrapper.getScaleFactor();
        this.currentScaleFactor = scaleX;
    }
}


export default Map;
