import MapStructure from "./MapStructure";
import chargerIconSVG from "../icons/charger.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

const img = new Image();
img.src = chargerIconSVG;

class ChargerLocationMapStructure extends MapStructure {
    public static TYPE = "ChargerLocationMapStructure";

    constructor(x0: number, y0: number) {
        super(x0, y0);
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const scaledSize = {
            width: considerHiDPI(img.width) / (considerHiDPI(4.5) / scaleFactor),
            height: considerHiDPI(img.height) / (considerHiDPI(4.5) / scaleFactor)
        };

        ctx.drawImage(
            this.getOptimizedImage(img, scaledSize.width, scaledSize.height),
            p0.x - scaledSize.width / 2,
            p0.y - scaledSize.height / 2,
            scaledSize.width,
            scaledSize.height
        );
    }

    getType(): string {
        return ChargerLocationMapStructure.TYPE;
    }
}

export default ChargerLocationMapStructure;
