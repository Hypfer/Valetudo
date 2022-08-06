import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import scaleButtonIconSVG from "../icons/scale_zone.svg";
import {StructureInterceptionHandlerResult} from "../Structure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {PointCoordinates} from "../../utils/types";
import {calculateBoxAroundPoint, isInsideBox} from "../../utils/helpers";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_scale_button = new Image();
img_scale_button.src = scaleButtonIconSVG;

const buttonHitboxPadding = 22.5;

class ZoneClientStructure extends ClientStructure {
    public static TYPE = "ZoneClientStructure";

    public x1: number;
    public y1: number;

    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        active?: boolean
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;

        this.active = active ?? true;


        this.x0 = Math.min(x0, x1);
        this.x1 = Math.max(x0, x1);

        this.y0 = Math.min(y0, y1);
        this.y1 = Math.max(y0, y1);
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number, pixelSize: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);

        const dimensions = {
            x: ((Math.round(this.x1) - Math.round(this.x0)) * pixelSize) / 100,
            y: ((Math.round(this.y1) - Math.round(this.y0)) * pixelSize) / 100
        };
        const label = dimensions.x.toFixed(2) + " x " + dimensions.y.toFixed(2) + "m";

        ctxWrapper.save();

        if (!this.active) {
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        } else {
            ctx.setLineDash([15, 5]);
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0)";
        }
        ctx.lineWidth = 2;

        ctx.fillRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);

        ctx.shadowColor = "rgba(0,0,0, 1)";
        ctx.shadowBlur = 2;

        ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);

        ctxWrapper.restore();

        ctxWrapper.save();
        ctx.textAlign = "start";
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.font = Math.round(6 * scaleFactor).toString(10) + "px sans-serif";
        ctx.fillText(label, p0.x, p0.y - 8);
        ctx.strokeText(label, p0.x, p0.y - 8);

        ctxWrapper.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p1.x - img_delete_button.width / 2,
                p0.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p1.x - img_scale_button.width / 2,
                p1.y - img_scale_button.height / 2
            );
        }
    }

    postProcess(): void {
        this.x0 = Math.round(this.x0);
        this.y0 = Math.round(this.y0);

        this.x1 = Math.round(this.x1);
        this.y1 = Math.round(this.y1);
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);

        const deleteButtonHitbox = calculateBoxAroundPoint({x: p1.x, y: p0.y}, buttonHitboxPadding);

        if (this.active && isInsideBox(tappedPoint, deleteButtonHitbox )) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (isInsideBox(tappedPoint, {topLeftBound: p0, bottomRightBound: p1})) {
            this.active = true;

            return {
                stopPropagation: true
            };
        } else if (this.active) {
            this.active = false;

            return {
                stopPropagation: false,
                requestDraw: true
            };
        } else {
            return {
                stopPropagation: false
            };
        }
    }

    translate(startCoordinates: PointCoordinates, lastCoordinates: PointCoordinates, currentCoordinates: PointCoordinates, transformationMatrixToScreenSpace : DOMMatrixInit, pixelSize: number) : StructureInterceptionHandlerResult {
        if (this.active) {
            const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);

            const resizeButtonHitbox = calculateBoxAroundPoint(p1, buttonHitboxPadding);

            if (!this.isResizing && isInsideBox(lastCoordinates, resizeButtonHitbox)) {
                this.isResizing = true;
            }

            const {
                dx,
                dy,
                currentInMapSpace
            } = ClientStructure.calculateTranslateDelta(lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace);

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x0 + pixelSize && this.x1 + dx > this.x0 + pixelSize) {
                    this.x1 += dx;
                }
                if (currentInMapSpace.y > this.y0 + pixelSize && this.y1 + dy > this.y0 + pixelSize) {
                    this.y1 += dy;
                }

                return {
                    stopPropagation: true
                };
            } else if (isInsideBox(lastCoordinates, {topLeftBound: p0, bottomRightBound: p1})) {
                this.x0 += dx;
                this.y0 += dy;
                this.x1 += dx;
                this.y1 += dy;

                return {
                    stopPropagation: true
                };
            } else {
                this.active = false;
            }
        }

        return {
            stopPropagation: false
        };
    }

    getType(): string {
        return ZoneClientStructure.TYPE;
    }
}

export default ZoneClientStructure;
