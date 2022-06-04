import MapStructure from "./MapStructure";
import robotIconSVG from "../icons/robot.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";

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
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const rotateRobot = (img: HTMLImageElement, scaledSize: {width: number, height: number}, angle: number) => {
            const canvasimg = document.createElement("canvas");
            canvasimg.width = scaledSize.width;
            canvasimg.height = scaledSize.height;

            const ctximg = canvasimg.getContext("2d");

            if (ctximg !== null) {
                ctximg.clearRect(0, 0, scaledSize.width, scaledSize.height);
                ctximg.translate(scaledSize.width / 2, scaledSize.width / 2);
                ctximg.rotate(angle * Math.PI / 180);
                ctximg.translate(-scaledSize.width / 2, -scaledSize.width / 2);
                ctximg.drawImage(img, 0, 0, scaledSize.width, scaledSize.height);
            }

            return canvasimg;
        };

        const scaledSize = {
            width: Math.max(img.width / (4.5 / scaleFactor), img.width),
            height: Math.max(img.height / (4.5 / scaleFactor), img.height)
        };

        ctx.drawImage(
            rotateRobot(img, scaledSize, this.angle),
            p0.x - scaledSize.width / 2,
            p0.y - scaledSize.height / 2,
            scaledSize.width,
            scaledSize.height
        );
    }

    getType(): string {
        return RobotPositionMapStructure.TYPE;
    }
}

export default RobotPositionMapStructure;
