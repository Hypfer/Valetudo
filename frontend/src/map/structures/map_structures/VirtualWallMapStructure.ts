import MapStructure from "./MapStructure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";


class VirtualWallMapStructure extends MapStructure {
    public static readonly TYPE = "VirtualWallMapStructure";

    private x1: number;
    private y1: number;


    constructor(
        x0: number, y0: number,
        x1: number, y1: number
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);


        ctxWrapper.save();


        ctx.strokeStyle = "rgb(239, 68, 68, 0.75)";
        ctx.lineWidth = considerHiDPI(5);
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();


        ctxWrapper.restore();
    }
}

export default VirtualWallMapStructure;
