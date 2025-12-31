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
    public static readonly TYPE = "ObstacleMapStructure";
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
            width: considerHiDPI(img.width) / (considerHiDPI(8) / scaleFactor),
            height: considerHiDPI(img.height) / (considerHiDPI(8) / scaleFactor)
        };

        const halfIconW = this.scaledIconSize.width / 2;
        const halfIconH = this.scaledIconSize.height / 2;

        ctx.drawImage(
            this.getOptimizedImage(img, this.scaledIconSize.width, this.scaledIconSize.height),
            p0.x - halfIconW,
            p0.y - halfIconH,
            this.scaledIconSize.width,
            this.scaledIconSize.height
        );

        if (this.label && scaleFactor >= considerHiDPI(28)) {
            ctxWrapper.save();

            const fontSize = 0.8 * scaleFactor;
            const textPadding = 0.25 * scaleFactor;

            const textY = p0.y + halfIconH + textPadding;

            this.drawPill(
                ctx,
                p0.x,
                textY,
                [{ text: this.label, fontSize: fontSize }],
                { baseline: "top" }
            );

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
}

export default ObstacleMapStructure;
