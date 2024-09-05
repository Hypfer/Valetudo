import MapStructure from "./MapStructure";
import obstacleIconSVG from "../icons/obstacle.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {calculateBoxAroundPoint, considerHiDPI, isInsideBox} from "../../utils/helpers";
import {PointCoordinates} from "../../utils/types";
import {StructureInterceptionHandlerResult} from "../Structure";
import ObstacleImage from "../../../components/ObstacleImage";
import {Typography} from "@mui/material";

const img = new Image();
img.src = obstacleIconSVG;

const hitboxPadding = 2.5;

class ObstacleMapStructure extends MapStructure {
    public static TYPE = "ObstacleMapStructure";
    private label: string | undefined;
    private id: string | undefined;
    private scaledIconSize: { width: number; height: number } = {width: 1, height: 1};
    private lastScaleFactor: number = 1;

    constructor(x0: number, y0: number, label?: string, id?: string) {
        super(x0, y0);

        this.label = label;
        this.id = id;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        this.lastScaleFactor = scaleFactor;

        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);


        this.scaledIconSize = {
            width: Math.max(considerHiDPI(img.width) / (considerHiDPI(8) / scaleFactor), considerHiDPI(img.width) * 0.3),
            height: Math.max(considerHiDPI(img.height) / (considerHiDPI(8) / scaleFactor), considerHiDPI(img.height) * 0.3)
        };

        ctx.drawImage(
            img,
            p0.x - this.scaledIconSize.width / 2,
            p0.y - this.scaledIconSize.height / 2,
            this.scaledIconSize.width,
            this.scaledIconSize.height
        );

        if (this.label && scaleFactor >= considerHiDPI(28)) {
            ctxWrapper.save();

            ctx.textAlign = "center";
            ctx.font = `${considerHiDPI(32)}px sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeStyle = "rgba(18, 18, 18, 1)";

            ctx.lineWidth = considerHiDPI(2.5);
            ctx.strokeText(this.label, p0.x , p0.y + (this.scaledIconSize.height/2) + considerHiDPI(32));

            ctx.lineWidth = considerHiDPI(1);
            ctx.fillText(this.label, p0.x , p0.y + (this.scaledIconSize.height/2) + considerHiDPI(32));

            ctxWrapper.restore();
        }
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const iconHitbox = calculateBoxAroundPoint(p0, (this.scaledIconSize.width / 2) + hitboxPadding);

        if (isInsideBox(tappedPoint, iconHitbox) && this.lastScaleFactor >= considerHiDPI(6)) {
            return {
                stopPropagation: true,
                openDialog: {
                    title: "Obstacle Information",
                    body: (
                        <>
                            {
                                this.id &&
                                <ObstacleImage id={this.id} />
                            }
                            <Typography sx={{marginTop: this.id ? "0.5rem" : undefined}}>
                                {this.label}
                            </Typography>
                        </>
                    )
                }
            };
        }

        return {
            stopPropagation: false
        };
    }

    getType(): string {
        return ObstacleMapStructure.TYPE;
    }
}

export default ObstacleMapStructure;
