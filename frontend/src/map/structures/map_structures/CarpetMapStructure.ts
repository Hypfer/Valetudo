import MapStructure from "./MapStructure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

class CarpetMapStructure extends MapStructure {
    public static readonly TYPE = "CarpetMapStructure";
    private static patternSourceCanvas: HTMLCanvasElement | null = null;

    private readonly points: Array<{x: number, y: number}>;


    constructor(
        points: Array<{x: number, y: number}>
    ) {
        super(points[0].x, points[0].y); // Doesn't really make sense here, but whatever
        this.points = points;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();

        const screenPoints = this.points.map(p =>
            new DOMPoint(p.x, p.y).matrixTransform(transformationMatrixToScreenSpace)
        );

        if (screenPoints.length < 3) {
            return;
        }

        ctxWrapper.save();

        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        for (let i = 1; i < screenPoints.length; i++) {
            ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        ctx.closePath();

        const pattern = this.getPattern(ctx);
        if (pattern) {
            const mapMatrix = DOMMatrix.fromMatrix(transformationMatrixToScreenSpace);

            const patternMatrix = new DOMMatrix();
            // Synchronize Pan X/Y to not have some weird window effect
            patternMatrix.e = mapMatrix.e;
            patternMatrix.f = mapMatrix.f;

            pattern.setTransform(patternMatrix);

            ctx.fillStyle = pattern;
            ctx.fill();
        }

        ctxWrapper.restore();
    }

    private getPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
        if (!CarpetMapStructure.patternSourceCanvas) {
            const patternCanvas = document.createElement("canvas");

            const size = considerHiDPI(10); // varying this gives vastly different looking results
            patternCanvas.width = size;
            patternCanvas.height = size;
            const pCtx = patternCanvas.getContext("2d");

            if (!pCtx) {
                return null;
            }

            pCtx.strokeStyle = "rgba(0, 0, 0, 0.25)";
            pCtx.lineWidth = 1;

            pCtx.beginPath();

            for (let i = -size; i < size * 2; i += 4) {
                pCtx.moveTo(i, -size);
                pCtx.lineTo(i + size, size * 2);
            }
            for (let i = -size; i < size * 2; i += 4) {
                pCtx.moveTo(-size, i + size);
                pCtx.lineTo(size * 2, i - size);
            }
            pCtx.stroke();

            CarpetMapStructure.patternSourceCanvas = patternCanvas;
        }

        return ctx.createPattern(CarpetMapStructure.patternSourceCanvas, "repeat");
    }
}

export default CarpetMapStructure;
