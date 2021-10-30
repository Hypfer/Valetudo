import MapStructure from "./MapStructure";
import segmentIconSVG from "../icons/segment.svg";
import segmentSelectedIconSVG from "../icons/segment_selected.svg";
import {PointCoordinates, StructureInterceptionHandlerResult} from "../Structure";

const img = new Image();
img.src = segmentIconSVG;

const img_selected = new Image();
img_selected.src = segmentSelectedIconSVG;

class SegmentLabelMapStructure extends MapStructure {
    public static TYPE = "SegmentLabelMapStructure";

    id: string;
    selected: boolean;
    private active: boolean;
    private area: number | undefined;
    public name: string | undefined;
    private scaledIconSize: { width: number; height: number } = {width: 1, height: 1};


    constructor(x0 : number ,y0 : number, id: string, selected: boolean, active: boolean, area?: number, name?: string) {
        super(x0, y0);

        this.id = id;
        this.selected = selected;
        this.active = active;
        this.area = area;
        this.name = name;
    }

    draw(ctx: CanvasRenderingContext2D, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const imageToUse = this.selected ? img_selected : img;

        this.scaledIconSize = {
            width: Math.max(
                imageToUse.width * (scaleFactor / 4),
                imageToUse.width * 0.8
            ),
            height: Math.max(
                imageToUse.height * (scaleFactor / 4),
                imageToUse.height * 0.8
            )
        };

        ctx.save();

        if (this.active) {
            ctx.translate(p0.x, p0.y);
            ctx.rotate(Math.PI);
            ctx.translate(-p0.x, -p0.y);
        }

        ctx.drawImage(
            imageToUse,
            p0.x - this.scaledIconSize.width / 2,
            p0.y - (this.scaledIconSize.height / 3)*2,
            this.scaledIconSize.width,
            this.scaledIconSize.height
        );

        ctx.restore();

        if (scaleFactor >= 9) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "45px sans-serif";
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            const text = this.name ? this.name : this.id;
            ctx.fillText(text, p0.x , p0.y + ((this.scaledIconSize.height/3)*2) + 20 + (this.active ? 25 : 0));
            ctx.strokeText(text, p0.x , p0.y + ((this.scaledIconSize.height/3)*2) + 20 + (this.active ? 25 : 0));


            if (this.area) {
                let areaString = (this.area / 10000).toPrecision(2) + " m²";
                if (this.name) {
                    areaString += `\n(id=${this.id})`;
                }

                ctx.font = "35px sans-serif";
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(areaString, p0.x , p0.y + ((this.scaledIconSize.height/3)*2) + 20 + (this.active ? 25 : 0) + 45);
                ctx.strokeText(areaString, p0.x , p0.y + ((this.scaledIconSize.height/3)*2) + 20 + (this.active ? 25 : 0) + 45);
            }

            ctx.restore();
        }
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        if (
            tappedPoint.x >= p0.x - this.scaledIconSize.width / 2 &&
            tappedPoint.x <= p0.x + this.scaledIconSize.width / 2 &&
            tappedPoint.y >= p0.y - this.scaledIconSize.height / 2 &&
            tappedPoint.y <= p0.y + this.scaledIconSize.height / 2
        ) {
            this.selected = !this.selected;

            return {
                stopPropagation: true
            };
        }

        return {
            stopPropagation: false
        };
    }

    getType(): string {
        return SegmentLabelMapStructure.TYPE;
    }
}

export default SegmentLabelMapStructure;
