import MapStructure from "./MapStructure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

class CurtainMapStructure extends MapStructure {
    public static readonly TYPE = "CurtainMapStructure";

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
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ctxWrapper.save();

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.translate(p0.x, p0.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);


        const BASE_WAVELENGTH_MAP_UNITS = 6;
        const BASE_AMPLITUDE_MAP_UNITS = 1;

        const wavelength = BASE_WAVELENGTH_MAP_UNITS * scaleFactor;
        const amplitude = BASE_AMPLITUDE_MAP_UNITS * scaleFactor;
        const fadeLength = wavelength * 0.35;
        const step = considerHiDPI(2);

        for (let x = 0; x <= distance; x += step) {
            const rawSine = Math.sin((x / wavelength) * (Math.PI * 2));
            const distToEdge = Math.min(x, distance - x);

            let fadeFactor = distToEdge / fadeLength;
            if (fadeFactor > 1) {
                fadeFactor = 1;
            }
            if (fadeFactor < 0) {
                fadeFactor = 0;
            }

            const smoothScale = fadeFactor * fadeFactor * (3 - 2 * fadeFactor);
            const y = rawSine * amplitude * smoothScale;

            ctx.lineTo(x, y);
        }

        ctx.lineTo(distance, 0);

        ctx.save();
        ctx.lineWidth = considerHiDPI(5);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.stroke();
        ctx.restore();

        ctx.lineWidth = considerHiDPI(3);
        ctx.strokeStyle = "rgb(6, 182, 212)";
        ctx.stroke();

        ctxWrapper.restore();
    }
}

export default CurtainMapStructure;
