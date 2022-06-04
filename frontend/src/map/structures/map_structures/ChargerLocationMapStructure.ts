import MapStructure from "./MapStructure";
import chargerIconSVG from "../icons/charger.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";

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
            width: Math.max(img.width / (4.5 / scaleFactor), img.width),
            height: Math.max(img.height / (4.5 / scaleFactor), img.height)
        };

        ctx.drawImage(
            img,
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
