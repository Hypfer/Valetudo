import {Canvas2DContextTrackingWrapper} from "../utils/Canvas2DContextTrackingWrapper";
import {PointCoordinates} from "../utils/types";

export type StructureInterceptionHandlerResult = {
    stopPropagation: boolean; //Will always redraw
    deleteMe?: boolean;
    requestDraw?: boolean; //Optional if things should be redrawn without stopping the event propagation
}

abstract class Structure {
    public static TYPE = "Structure";

    public x0: number; //In pixel map space
    public y0: number; //In pixel map space
    public type: string;
    public isResizing = false;

    protected constructor(x0 : number, y0: number) {
        this.x0 = x0;
        this.y0 = y0;

        this.type = this.getType();
    }

    abstract draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number, pixelSize: number) : void

    /**
     * Handler for intercepting tap events on the canvas
     *
     * @param {PointCoordinates} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformationMatrixToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        return {
            stopPropagation: false
        };
    }

    abstract getType(): string

    /**
     * This is handler is called on each endTranslate.
     * It allows us to do post-processing such as snapping
     */
    //eslint-disable-next-line @typescript-eslint/no-empty-function
    postProcess() : void {
        //intentional
    }
}

export default Structure;
