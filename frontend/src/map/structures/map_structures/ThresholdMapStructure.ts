import MapStructure from "./MapStructure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

class ThresholdMapStructure extends MapStructure {
    public static readonly TYPE = "ThresholdMapStructure";

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

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const MAP_UNIT_WIDTH = 1;
        const scaledWidth = MAP_UNIT_WIDTH * scaleFactor;

        ctxWrapper.save();

        ctx.translate(p0.x, p0.y);
        ctx.rotate(angle);

        ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
        ctx.fillRect(0, -scaledWidth / 2, length, scaledWidth);

        const grooveCount = 8;
        const step = scaledWidth / (grooveCount + 1);

        ctx.beginPath();
        ctx.lineWidth = Math.max(0.5, considerHiDPI(0.5));
        ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";

        for (let i = 1; i <= grooveCount; i++) {
            const yOffset = -scaledWidth / 2 + (step * i);
            ctx.moveTo(0, yOffset);
            ctx.lineTo(length, yOffset);
        }
        ctx.stroke();

        ctx.lineWidth = considerHiDPI(1);
        ctx.strokeStyle = "rgb(16, 185, 129)";
        ctx.strokeRect(0, -scaledWidth / 2, length, scaledWidth);

        ctxWrapper.restore();
    }
}

export default ThresholdMapStructure;
