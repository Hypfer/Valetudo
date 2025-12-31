import MapStructure from "./MapStructure";
import goToTargetIconSVG from "../icons/marker_active.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

const img = new Image();
img.src = goToTargetIconSVG;

class GoToTargetMapStructure extends MapStructure {
    public static readonly TYPE = "GoToTargetMapStructure";

    constructor(x0: number, y0: number) {
        super(x0, y0);
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const scaledSize = {
            width: considerHiDPI(img.width) / (considerHiDPI(7) / scaleFactor),
            height: considerHiDPI(img.height) / (considerHiDPI(7) / scaleFactor)
        };

        ctx.drawImage(
            this.getOptimizedImage(img, scaledSize.width, scaledSize.height),
            p0.x - scaledSize.width / 2,
            p0.y - scaledSize.height,
            scaledSize.width,
            scaledSize.height
        );
    }
}

export default GoToTargetMapStructure;
