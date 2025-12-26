import MapStructure from "./MapStructure";
import robotIconSVG from "../icons/robot.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

const img = new Image();
img.src = robotIconSVG;

class RobotPositionMapStructure extends MapStructure {
    public static TYPE = "RobotPositionMapStructure";

    private readonly angle: number;

    constructor(x0 : number ,y0 : number, angle: number) {
        super(x0, y0);

        this.angle = angle;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const scaledSize = {
            width: considerHiDPI(img.width) / (considerHiDPI(4.5) / scaleFactor),
            height: considerHiDPI(img.height) / (considerHiDPI(4.5) / scaleFactor)
        };

        if (scaledSize.width < 1 || scaledSize.height < 1) {
            return;
        }

        const rotateRobot = (source: CanvasImageSource, size: {width: number, height: number}, angle: number) => {
            const canvasWidth = Math.round(size.width);
            const canvasHeight = Math.round(size.height);

            const canvasimg = document.createElement("canvas");
            canvasimg.width = canvasWidth;
            canvasimg.height = canvasHeight;
            const ctximg = canvasimg.getContext("2d");

            if (ctximg) {
                ctximg.translate(canvasWidth / 2, canvasHeight / 2);
                ctximg.rotate(angle * Math.PI / 180);
                ctximg.translate(-canvasWidth / 2, -canvasHeight / 2);
                ctximg.drawImage(source, 0, 0, canvasWidth, canvasHeight);
            }

            return canvasimg;
        };

        const rotatedImg = rotateRobot(
            this.getOptimizedImage(img, scaledSize.width, scaledSize.height),
            scaledSize,
            this.angle
        );


        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        ctx.drawImage(
            rotatedImg,
            p0.x - rotatedImg.width / 2,
            p0.y - rotatedImg.height / 2,
            rotatedImg.width,
            rotatedImg.height
        );
    }

    getType(): string {
        return RobotPositionMapStructure.TYPE;
    }
}

export default RobotPositionMapStructure;
