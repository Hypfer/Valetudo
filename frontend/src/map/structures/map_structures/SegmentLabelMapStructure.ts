import MapStructure from "./MapStructure";
import segmentIconSVG from "../icons/segment.svg";
import segmentSelectedIconSVG from "../icons/segment_selected.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";

const img = new Image();
img.src = segmentIconSVG;

const img_selected = new Image();
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
                considerHiDPI(imageToUse.width) * (scaleFactor / considerHiDPI(4)),
                considerHiDPI(imageToUse.width) * 0.8
            ),
            height: Math.max(
                considerHiDPI(imageToUse.height) * (scaleFactor / considerHiDPI(4)),
                considerHiDPI(imageToUse.height) * 0.8
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

        if (this.topLabel && scaleFactor >= considerHiDPI(1.2)) {
            const yOffset = ((this.scaledIconSize.height/3)*2) + (this.active ? 0 : considerHiDPI(10));

            // Based on previous "just looked right" numbers and regression
            const fontSize = 5 * scaleFactor;

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

        if (scaleFactor >= considerHiDPI(5)) {
            // Based on previous "just looked right" numbers and regression
            const fontSize = Math.floor(Math.log(scaleFactor)*11.89 + 6.84);
            const maxNameLabelLength = Math.floor(Math.log(scaleFactor)*14.06 - 11.6);

            ctxWrapper.save();
            ctx.textAlign = "center";
            ctx.font = `${considerHiDPI(fontSize)}px sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeStyle = "rgba(18, 18, 18, 1)";

            if (this.name) {
                const nameLabel = this.name.length > maxNameLabelLength ? `${this.name.substring(0, maxNameLabelLength - 3)}...` : this.name;

                ctx.lineWidth = considerHiDPI(2.5);
                ctx.strokeText(
                    nameLabel,
                    p0.x ,
                    p0.y + (
                        (this.scaledIconSize.height/3)*2 +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0)
                    )
                );

                ctx.lineWidth = considerHiDPI(1);
                ctx.fillText(
                    nameLabel,
                    p0.x ,
                    p0.y + (
                        (this.scaledIconSize.height/3)*2 +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0)
                    )
                );
            }

            if (scaleFactor >= considerHiDPI(11)) {
                let metaString = (this.area / 10000).toPrecision(2) + " m²";
                metaString += ` (id=${this.id})`;

                ctx.font = `${considerHiDPI(fontSize - 5)}px sans-serif`;

                ctx.lineWidth = considerHiDPI(2.5);
                ctx.strokeText(
                    metaString,
                    p0.x ,
                    p0.y + (
                        ((this.scaledIconSize.height/3) *2) +
                        considerHiDPI(20) +
                        (this.active ? considerHiDPI(25) : 0) +
                        (this.name ? considerHiDPI(fontSize + 10) : 0)
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
                        (this.name ? considerHiDPI(fontSize + 10) : 0)
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
