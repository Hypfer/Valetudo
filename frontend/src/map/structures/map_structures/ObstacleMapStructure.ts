import MapStructure from "./MapStructure";
import obstacleIconSVG from "../icons/obstacle.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {ValetudoMapCanvasImageAsset} from "../../utils/ValetudoMapCanvasImageAsset";
import {considerHiDPI} from "../../utils/helpers";

const img = new ValetudoMapCanvasImageAsset();
img.src = obstacleIconSVG;

class ObstacleMapStructure extends MapStructure {
    public static TYPE = "ObstacleMapStructure";
    private label: string | undefined;

    constructor(x0: number, y0: number, label?: string) {
        super(x0, y0);

        this.label = label;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);


        const scaledSize = {
            width: Math.max(img.hiDPIAwareWidth / (considerHiDPI(8) / scaleFactor), img.hiDPIAwareWidth * 0.3),
            height: Math.max(img.hiDPIAwareHeight / (considerHiDPI(8) / scaleFactor), img.hiDPIAwareHeight * 0.3)
        };

        ctx.drawImage(
            img,
            p0.x - scaledSize.width / 2,
            p0.y - scaledSize.height / 2,
            scaledSize.width,
            scaledSize.height
        );

        if (this.label && scaleFactor >= considerHiDPI(28)) {
            ctxWrapper.save();

            ctx.textAlign = "center";
            ctx.font = `${considerHiDPI(32)}px sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeStyle = "rgba(18, 18, 18, 1)";

            ctx.lineWidth = considerHiDPI(2.5);
            ctx.strokeText(this.label, p0.x , p0.y + (scaledSize.height/2) + considerHiDPI(32));

            ctx.lineWidth = considerHiDPI(1);
            ctx.fillText(this.label, p0.x , p0.y + (scaledSize.height/2) + considerHiDPI(32));

            ctxWrapper.restore();
        }
    }

    getType(): string {
        return ObstacleMapStructure.TYPE;
    }
}

export default ObstacleMapStructure;
