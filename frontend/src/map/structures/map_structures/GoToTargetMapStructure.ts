import MapStructure from "./MapStructure";
import goToTargetIconSVG from "../icons/marker_active.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {ValetudoMapCanvasImageAsset} from "../../utils/ValetudoMapCanvasImageAsset";
import {considerHiDPI} from "../../utils/helpers";

const img = new ValetudoMapCanvasImageAsset();
img.src = goToTargetIconSVG;

class GoToTargetMapStructure extends MapStructure {
    public static TYPE = "GoToTargetMapStructure";

    constructor(x0: number, y0: number) {
        super(x0, y0);
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);


        const scaledSize = {
            width: Math.max(img.hiDPIAwareWidth / (considerHiDPI(7) / scaleFactor), img.hiDPIAwareWidth),
            height: Math.max(img.hiDPIAwareHeight / (considerHiDPI(7) / scaleFactor), img.hiDPIAwareHeight)
        };

        ctx.drawImage(
            img,
            p0.x - scaledSize.width / 2,
            p0.y - scaledSize.height,
            scaledSize.width,
            scaledSize.height
        );
    }

    getType(): string {
        return GoToTargetMapStructure.TYPE;
    }
}

export default GoToTargetMapStructure;
