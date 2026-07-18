import ClientStructure from "./ClientStructure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {PointCoordinates} from "../../utils/types";
import {StructureInterceptionHandlerResult} from "../Structure";
import {calculateBoxAroundPoint, considerHiDPI, isInsideBox} from "../../utils/helpers";

import deleteButtonIconSVG from "../icons/delete_zone.svg";
import scaleButtonIconSVG from "../icons/scale_zone.svg";
import rotateButtonIconSVG from "../icons/rotate_zone.svg";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_scale_button = new Image();
img_scale_button.src = scaleButtonIconSVG;

const img_rotate_button = new Image();
img_rotate_button.src = rotateButtonIconSVG;

class RampClientStructure extends ClientStructure {
    public static readonly TYPE = "RampClientStructure";

    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;
    public x3: number;
    public y3: number;

    public isResizing: boolean = false;
    public isRotating: boolean = false;

    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
        active?: boolean
    ) {
        super(x0, y0);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;

        this.active = active ?? true;
    }

    private getCentroid(): {x: number, y: number} {
        return {
            x: (this.x0 + this.x1 + this.x2 + this.x3) / 4,
            y: (this.y0 + this.y1 + this.y2 + this.y3) / 4
        };
    }

    private rotatePoint(px: number, py: number, cx: number, cy: number, angleRad: number): {x: number, y: number} {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const dx = px - cx;
        const dy = py - cy;
        return {
            x: cx + (dx * cos - dy * sin),
            y: cy + (dx * sin + dy * cos)
        };
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();

        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformationMatrixToScreenSpace);

        ctxWrapper.save();

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0, 0.6)";
        ctx.lineWidth = considerHiDPI(7);
        ctx.stroke();
        ctx.restore();

        ctx.lineWidth = considerHiDPI(5);
        if (this.active) {
            ctx.strokeStyle = "rgb(6, 182, 212)";
            ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
            ctx.setLineDash([considerHiDPI(8), considerHiDPI(6)]);
        } else {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.7)";
            ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
        }
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.clip();

        if (this.active) {
            ctx.strokeStyle = "rgb(6, 182, 212)";
        } else {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.7)";
        }

        ctx.lineWidth = considerHiDPI(3);
        ctx.setLineDash([]);

        const vW = { x: p1.x - p0.x, y: p1.y - p0.y };
        const vH = { x: p3.x - p0.x, y: p3.y - p0.y };

        const lenW = Math.hypot(vW.x, vW.y);
        const lenH = Math.hypot(vH.x, vH.y);

        const uW = { x: vW.x / lenW, y: vW.y / lenW };
        const uH = { x: vH.x / lenH, y: vH.y / lenH };

        const maxArrowWidth = 50 * scaleFactor;
        const arrowWidth = Math.min(lenW * 0.75, maxArrowWidth);
        const arrowHeight = arrowWidth * 0.5;

        const spacing = arrowHeight * 1.4;

        const topCenterX = p0.x + vW.x * 0.5;
        const topCenterY = p0.y + vW.y * 0.5;

        const startOffset = arrowHeight * 0.75;

        const count = Math.ceil(lenH / spacing) + 1;

        for (let i = 0; i < count; i++) {
            const dist = startOffset + i * spacing;

            const cx = topCenterX + uH.x * dist;
            const cy = topCenterY + uH.y * dist;

            const tipX = cx - uH.x * (arrowHeight * 0.5);
            const tipY = cy - uH.y * (arrowHeight * 0.5);

            const baseX = cx + uH.x * (arrowHeight * 0.5);
            const baseY = cy + uH.y * (arrowHeight * 0.5);

            const lx = baseX - uW.x * (arrowWidth * 0.5);
            const ly = baseY - uW.y * (arrowWidth * 0.5);

            const rx = baseX + uW.x * (arrowWidth * 0.5);
            const ry = baseY + uW.y * (arrowWidth * 0.5);

            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(rx, ry);
            ctx.stroke();
        }

        ctx.restore();
        ctxWrapper.restore();

        if (this.active) {
            const scaledDeleteButtonSize = this.getControlElementImageScaledSize(img_delete_button, scaleFactor);
            const scaledRotateButtonSize = this.getControlElementImageScaledSize(img_rotate_button, scaleFactor);
            const scaledScaleButtonSize = this.getControlElementImageScaledSize(img_scale_button, scaleFactor);

            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const angle = Math.atan2(dy, dx);

            const drawRotatedIcon = (img: HTMLImageElement, x: number, y: number, size: {width: number, height: number}) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.drawImage(
                    this.getOptimizedImage(img, size.width, size.height),
                    -size.width / 2,
                    -size.height / 2,
                    size.width,
                    size.height
                );
                ctx.restore();
            };

            drawRotatedIcon(img_delete_button, p0.x, p0.y, scaledDeleteButtonSize);
            drawRotatedIcon(img_rotate_button, p1.x, p1.y, scaledRotateButtonSize);
            drawRotatedIcon(img_scale_button, p2.x, p2.y, scaledScaleButtonSize);
        }
    }

    private isInsidePolygon(point: PointCoordinates, vs: DOMPoint[]): boolean {
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y;
            const xj = vs[j].x, yj = vs[j].y;
            const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }

    tap(tappedPoint: PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformationMatrixToScreenSpace);

        if (this.active) {
            const scaledDeleteButtonSize = this.getControlElementImageScaledSize(img_delete_button, scaleFactor);
            const scaledRotateButtonSize = this.getControlElementImageScaledSize(img_rotate_button, scaleFactor);
            const scaledScaleButtonSize = this.getControlElementImageScaledSize(img_scale_button, scaleFactor);

            const deleteButtonHitboxPadding = Math.max(scaledDeleteButtonSize.width, scaledDeleteButtonSize.height) / 2;
            const rotateButtonHitboxPadding = Math.max(scaledRotateButtonSize.width, scaledRotateButtonSize.height) / 2;
            const scaleButtonHitboxPadding = Math.max(scaledScaleButtonSize.width, scaledScaleButtonSize.height) / 2;

            if (isInsideBox(tappedPoint, calculateBoxAroundPoint(p0, deleteButtonHitboxPadding))) {
                return { deleteMe: true, stopPropagation: true };
            }
            if (isInsideBox(tappedPoint, calculateBoxAroundPoint(p1, rotateButtonHitboxPadding)) ||
                isInsideBox(tappedPoint, calculateBoxAroundPoint(p2, scaleButtonHitboxPadding))) {
                return { stopPropagation: true };
            }
        }

        if (this.isInsidePolygon(tappedPoint, [p0, p1, p2, p3])) {
            this.active = true;
            return { stopPropagation: true, requestDraw: true };
        } else if (this.active) {
            this.active = false;
            return { stopPropagation: false, requestDraw: true };
        }

        return { stopPropagation: false };
    }

    translate(
        startCoordinates: PointCoordinates,
        lastCoordinates: PointCoordinates,
        currentCoordinates: PointCoordinates,
        transformationMatrixToScreenSpace: DOMMatrixInit,
        scaleFactor: number,
        pixelSize: number
    ): StructureInterceptionHandlerResult {
        if (this.active) {
            const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);
            const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformationMatrixToScreenSpace);

            const scaledRotateButtonSize = this.getControlElementImageScaledSize(img_rotate_button, scaleFactor);
            const scaledScaleButtonSize = this.getControlElementImageScaledSize(img_scale_button, scaleFactor);

            const rotateButtonHitboxPadding = Math.max(scaledRotateButtonSize.width, scaledRotateButtonSize.height) / 2;
            const scaleButtonHitboxPadding = Math.max(scaledScaleButtonSize.width, scaledScaleButtonSize.height) / 2;

            if (!this.isResizing && !this.isRotating) {
                if (isInsideBox(lastCoordinates, calculateBoxAroundPoint(p2, scaleButtonHitboxPadding))) {
                    this.isResizing = true;
                } else if (isInsideBox(lastCoordinates, calculateBoxAroundPoint(p1, rotateButtonHitboxPadding))) {
                    this.isRotating = true;
                }
            }

            const centroid = this.getCentroid();
            const centerScreen = new DOMPoint(centroid.x, centroid.y).matrixTransform(transformationMatrixToScreenSpace);

            const { currentInMapSpace } = ClientStructure.calculateTranslateDelta(lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace);

            if (this.isRotating) {
                const angleLast = Math.atan2(lastCoordinates.y - centerScreen.y, lastCoordinates.x - centerScreen.x);
                const angleCurr = Math.atan2(currentCoordinates.y - centerScreen.y, currentCoordinates.x - centerScreen.x);
                const deltaRad = angleCurr - angleLast;

                const r0 = this.rotatePoint(this.x0, this.y0, centroid.x, centroid.y, deltaRad);
                const r1 = this.rotatePoint(this.x1, this.y1, centroid.x, centroid.y, deltaRad);
                const r2 = this.rotatePoint(this.x2, this.y2, centroid.x, centroid.y, deltaRad);
                const r3 = this.rotatePoint(this.x3, this.y3, centroid.x, centroid.y, deltaRad);

                this.x0 = r0.x; this.y0 = r0.y;
                this.x1 = r1.x; this.y1 = r1.y;
                this.x2 = r2.x; this.y2 = r2.y;
                this.x3 = r3.x; this.y3 = r3.y;

                return { stopPropagation: true };
            } else if (this.isResizing) {
                const dx = this.x1 - this.x0;
                const dy = this.y1 - this.y0;
                const len = Math.hypot(dx, dy);
                if (len < 0.001) {
                    return { stopPropagation: true };
                }

                const ux = dx / len;
                const uy = dy / len;

                const hdx = this.x3 - this.x0;
                const hdy = this.y3 - this.y0;
                const hLen = Math.hypot(hdx, hdy);
                let vx = hdx / hLen;
                let vy = hdy / hLen;

                if (hLen < 0.001) {
                    vx = -uy; vy = ux;
                }

                const mouseVecX = currentInMapSpace.x - this.x0;
                const mouseVecY = currentInMapSpace.y - this.y0;

                let newWidth = (mouseVecX * ux) + (mouseVecY * uy);
                let newHeight = (mouseVecX * vx) + (mouseVecY * vy);

                newWidth = Math.max(5, newWidth);
                newHeight = Math.max(5, newHeight);

                this.x1 = this.x0 + (newWidth * ux);
                this.y1 = this.y0 + (newWidth * uy);

                this.x3 = this.x0 + (newHeight * vx);
                this.y3 = this.y0 + (newHeight * vy);

                this.x2 = this.x0 + (newWidth * ux) + (newHeight * vx);
                this.y2 = this.y0 + (newWidth * uy) + (newHeight * vy);

                return { stopPropagation: true };
            } else {
                if (this.isInsidePolygon(lastCoordinates, [p0, p1, p2, p3])) {
                    const { dx, dy } = ClientStructure.calculateTranslateDelta(lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace);
                    this.x0 += dx; this.y0 += dy;
                    this.x1 += dx; this.y1 += dy;
                    this.x2 += dx; this.y2 += dy;
                    this.x3 += dx; this.y3 += dy;

                    return { stopPropagation: true };
                }
            }
        }

        return { stopPropagation: false };
    }

    postProcess(): void {
        this.isRotating = false;
        this.isResizing = false;

        const cx = (this.x0 + this.x1 + this.x2 + this.x3) / 4;
        const cy = (this.y0 + this.y1 + this.y2 + this.y3) / 4;

        const wTop = Math.hypot(this.x1 - this.x0, this.y1 - this.y0);
        const wBot = Math.hypot(this.x2 - this.x3, this.y2 - this.y3);
        const width = (wTop + wBot) / 2;

        const hLeft = Math.hypot(this.x3 - this.x0, this.y3 - this.y0);
        const hRight = Math.hypot(this.x2 - this.x1, this.y2 - this.y1);
        const height = (hLeft + hRight) / 2;

        let angleRad = Math.atan2(this.y1 - this.y0, this.x1 - this.x0);
        const angleDeg = angleRad * (180 / Math.PI);
        const snappedDeg = Math.round(angleDeg / 5) * 5;
        angleRad = snappedDeg * (Math.PI / 180);

        const rW = Math.round(width);
        const rH = Math.round(height);

        const unrotatedLeft = cx - (rW / 2);
        const unrotatedTop = cy - (rH / 2);

        const snappedLeft = Math.round(unrotatedLeft);
        const snappedTop = Math.round(unrotatedTop);

        const rCx = snappedLeft + (rW / 2);
        const rCy = snappedTop + (rH / 2);

        const halfW = rW / 2;
        const halfH = rH / 2;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const getPoint = (u: number, v: number) => ({
            x: rCx + (u * cos - v * sin),
            y: rCy + (u * sin + v * cos)
        });

        const p0 = getPoint(-halfW, -halfH);
        this.x0 = p0.x; this.y0 = p0.y;

        const p1 = getPoint(halfW, -halfH);
        this.x1 = p1.x; this.y1 = p1.y;

        const p2 = getPoint(halfW, halfH);
        this.x2 = p2.x; this.y2 = p2.y;

        const p3 = getPoint(-halfW, halfH);
        this.x3 = p3.x; this.y3 = p3.y;
    }
}

export default RampClientStructure;
