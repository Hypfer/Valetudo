import { Canvas2DContextTrackingWrapper } from "../../utils/Canvas2DContextTrackingWrapper";
import MapStructure from "./MapStructure";


class ActiveZoneMapStructure extends MapStructure {
    public static TYPE = "ActiveZoneMapStructure";

    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;
    private x3: number;
    private y3: number;

    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformationMatrixToScreenSpace);


        ctxWrapper.save();


        ctx.strokeStyle = "rgb(53, 145, 26)";
        ctx.fillStyle = "rgba(107, 244, 66, 0.3)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();


        ctxWrapper.restore();
    }

    getType(): string {
        return ActiveZoneMapStructure.TYPE;
    }
}

export default ActiveZoneMapStructure;
