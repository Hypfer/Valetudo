import MapStructure from "./MapStructure";
import segmentIconSVG from "../icons/segment.svg";
import segmentSelectedIconSVG from "../icons/segment_selected.svg";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {considerHiDPI} from "../../utils/helpers";
import {RawMapLayerMaterial} from "../../../api";

const img = new Image();
img.src = segmentIconSVG;

const img_selected = new Image();
img_selected.src = segmentSelectedIconSVG;


class SegmentLabelMapStructure extends MapStructure {
    public static readonly TYPE = "SegmentLabelMapStructure";

    id: string;
    selected: boolean;
    topLabel: string | undefined;
    private active: boolean;
    private area: number;
    public name: string | undefined;
    public material: RawMapLayerMaterial | undefined;
    private scaledIconSize: { width: number; height: number } = {width: 1, height: 1};


    constructor(
        x0 : number,
        y0 : number,
        id: string,
        selected: boolean,
        active: boolean,
        area: number,
        name: string | undefined,
        material: RawMapLayerMaterial | undefined
    ) {
        super(x0, y0);

        this.id = id;
        this.selected = selected;
        this.active = active;
        this.area = area;
        this.name = name;
        this.material = material;
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const imageToUse = this.selected ? img_selected : img;

        this.scaledIconSize = {
            width: considerHiDPI(imageToUse.width) * (scaleFactor / considerHiDPI(4)),
            height: considerHiDPI(imageToUse.height) * (scaleFactor / considerHiDPI(4))
        };

        const anchorX = this.scaledIconSize.width / 2;
        const anchorY = (this.scaledIconSize.height / 3) * 2;

        ctxWrapper.save();
        ctxWrapper.translate(p0.x, p0.y);
        if (this.active) {
            ctxWrapper.rotate(Math.PI);
        }
        ctx.drawImage(
            this.getOptimizedImage(imageToUse, this.scaledIconSize.width, this.scaledIconSize.height),
            -anchorX,
            -anchorY,
            this.scaledIconSize.width,
            this.scaledIconSize.height
        );
        ctxWrapper.restore();

        if (this.topLabel) {
            const distanceAnchorToTop = anchorY;
            const distanceAnchorToBottom = this.scaledIconSize.height - anchorY;

            const iconTopEdgeY = this.active ?
                p0.y - distanceAnchorToBottom :
                p0.y - distanceAnchorToTop;

            const textPadding = 1 * scaleFactor;
            const finalY = iconTopEdgeY - textPadding;

            ctxWrapper.save();

            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.font = `${5 * scaleFactor}px "IBM Plex Sans", "Helvetica", sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeStyle = "rgba(18, 18, 18, 1)";

            ctx.lineWidth = considerHiDPI(2.5);
            ctx.strokeText(this.topLabel, p0.x, finalY);

            ctx.lineWidth = considerHiDPI(1);
            ctx.fillText(this.topLabel, p0.x, finalY);

            ctxWrapper.restore();
        }


        const distanceAnchorToTop = anchorY;
        const distanceAnchorToBottom = this.scaledIconSize.height - anchorY;

        const iconBottomEdgeY = this.active ?
            p0.y + distanceAnchorToTop :
            p0.y + distanceAnchorToBottom;

        const textPadding = 0.75 * scaleFactor;
        const finalY = iconBottomEdgeY + textPadding;
        const baseFontSize = 1.75 * scaleFactor;

        const linesToDraw= [];

        if (this.name) {
            const maxNameLabelLength = Math.min(3 * scaleFactor, 48);
            const nameLabel = this.name.length > maxNameLabelLength ?
                `${this.name.substring(0, maxNameLabelLength - 3)}...` :
                this.name;

            linesToDraw.push({ text: nameLabel, fontSize: baseFontSize });
        }

        if (scaleFactor >= considerHiDPI(11)) {
            let metaString = (this.area / 10000).toPrecision(2) + " m²";
            metaString += ` (id=${this.id})`;

            linesToDraw.push({ text: metaString, fontSize: baseFontSize - 5 });
        }

        if (linesToDraw.length > 0) {
            ctxWrapper.save();
            this.drawPill(
                ctx,
                p0.x,
                finalY,
                linesToDraw,
                { baseline: "top" }
            );
            ctxWrapper.restore();
        }
    }

    onTap() {
        this.selected = !this.selected;
    }
}

export default SegmentLabelMapStructure;
