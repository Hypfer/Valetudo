import MapStructure from "./MapStructure";
import segmentIconSVG from "../icons/segment.svg";
import segmentSelectedIconSVG from "../icons/segment_selected.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {ValetudoMapCanvasImageAsset} from "../../utils/ValetudoMapCanvasImageAsset";
import {considerHiDPI} from "../../utils/helpers";

const img = new ValetudoMapCanvasImageAsset();
img.src = segmentIconSVG;

const img_selected = new ValetudoMapCanvasImageAsset();
img_selected.src = segmentSelectedIconSVG;


class SegmentLabelMapStructure extends MapStructure {
    public static TYPE = "SegmentLabelMapStructure";

    id: string;
    selected: boolean;
    topLabel: string | undefined;
    private active: boolean;
    private area: number;
    public name: string | undefined;
    private scaledIconSize: { width: number; height: number } = {width: 1, height: 1};


    constructor(x0 : number ,y0 : number, id: string, selected: boolean, active: boolean, area: number, name?: string) {
        super(x0, y0);

        this.id = id;
        this.selected = selected;
        this.active = active;
        this.area = area;
        this.name = name;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const imageToUse = this.selected ? img_selected : img;

        this.scaledIconSize = {
            width: Math.max(
                imageToUse.hiDPIAwareWidth * (scaleFactor / 4),
                imageToUse.hiDPIAwareWidth * 0.8
            ),
            height: Math.max(
                imageToUse.hiDPIAwareHeight * (scaleFactor / 4),
                imageToUse.hiDPIAwareHeight * 0.8
            )
        };

        ctxWrapper.save();

        if (this.active) {
            ctxWrapper.translate(p0.x, p0.y);
            ctxWrapper.rotate(Math.PI);
            ctxWrapper.translate(-p0.x, -p0.y);
        }

        ctx.drawImage(
            imageToUse,
            p0.x - this.scaledIconSize.width / 2,
            p0.y - (this.scaledIconSize.height / 3)*2,
            this.scaledIconSize.width,
            this.scaledIconSize.height
        );

        ctxWrapper.restore();

        if (this.topLabel && scaleFactor >= 1.2) {
            let fontSize;
            const yOffset = ((this.scaledIconSize.height/3)*2) + (this.active ? 0 : considerHiDPI(10));

            if (scaleFactor >= 9) {
                fontSize = 45;
            } else if (scaleFactor >= 8) {
                fontSize = 40;
            } else if (scaleFactor >= 7) {
                fontSize = 35;
            } else if (scaleFactor >= 6) {
                fontSize = 30;
            } else {
                fontSize = 25;
            }

            ctxWrapper.save();

            ctx.textAlign = "center";
            ctx.font = `${considerHiDPI(fontSize)}px sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeStyle = "rgba(18, 18, 18, 1)";

            ctx.lineWidth = considerHiDPI(2.5);
            ctx.strokeText(this.topLabel, p0.x , p0.y - yOffset);

            ctx.lineWidth = considerHiDPI(1);
            ctx.fillText(this.topLabel, p0.x , p0.y - yOffset);

            ctxWrapper.restore();
        }

        if (scaleFactor >= 7) {
            ctxWrapper.save();
            ctx.textAlign = "center";
            ctx.font = `${considerHiDPI(45)}px sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeStyle = "rgba(18, 18, 18, 1)";

            if (this.name) {
                ctx.lineWidth = considerHiDPI(2.5);
                ctx.strokeText(
                    this.name,
                    p0.x ,
                    p0.y + (
                        (this.scaledIconSize.height/3)*2 +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0)
                    )
                );

                ctx.lineWidth = considerHiDPI(1);
                ctx.fillText(
                    this.name,
                    p0.x ,
                    p0.y + (
                        (this.scaledIconSize.height/3)*2 +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0)
                    )
                );
            }

            if (scaleFactor >= 11) {
                let metaString = (this.area / 10000).toPrecision(2) + " m²";
                metaString += ` (id=${this.id})`;

                ctx.font = `${considerHiDPI(35)}px sans-serif`;

                ctx.lineWidth = considerHiDPI(2.5);
                ctx.strokeText(
                    metaString,
                    p0.x ,
                    p0.y + (
                        ((this.scaledIconSize.height/3) *2) +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0) +
                        (this.name ? considerHiDPI(45) : 0)
                    )
                );

                ctx.lineWidth = considerHiDPI(1);
                ctx.fillText(
                    metaString,
                    p0.x ,
                    p0.y + (
                        ((this.scaledIconSize.height/3) *2) +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0) +
                        (this.name ? considerHiDPI(45) : 0)
                    )
                );
            }


            ctxWrapper.restore();
        }
    }

    onTap() {
        this.selected = !this.selected;
    }

    getType(): string {
        return SegmentLabelMapStructure.TYPE;
    }
}

export default SegmentLabelMapStructure;
