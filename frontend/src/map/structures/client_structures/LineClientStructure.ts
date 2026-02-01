import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import moveButtonIconSVG from "../icons/move_zone.svg";
import {StructureInterceptionHandlerResult} from "../Structure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";
import {PointCoordinates} from "../../utils/types";
import {calculateBoxAroundPoint, considerHiDPI, isInsideBox} from "../../utils/helpers";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_move_button = new Image();
img_move_button.src = moveButtonIconSVG;

const lineHitboxPadding = considerHiDPI(22.5);

abstract class LineClientStructure extends ClientStructure {
    public x1: number;
    public y1: number;

    /*
        We use this matrix approach to remove the rotation of our line before calculating if an input relates
        to it. This makes it a lot easier than having to deal with rotated rectangles
        
        By applying this matrix transformation, we "normalize" our lines' coordinates so that both ends end up
        with the same x coordinate. If we now apply the same transformation to the input event coordinates
        we can easily check if that event was inside a box drawn around our line
        
        You can imagine it like this:
        ╔ │ ╗
        ║ │ ║
        ║ │ ║
        ╚ │ ╝
        
        no matter at what angle the actual displayed line might be / \ - 
     */
    private rotationRemovalTransformationMatrix: DOMMatrix = new DOMMatrix();

    private lineHitbox = {
        topLeftBound: new DOMPoint(),
        bottomRightBound: new DOMPoint()
    };


    protected constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        active: boolean
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;

        this.active = active;
    }

    protected abstract setLineStyle(ctx: CanvasRenderingContext2D) : void;

    protected drawLine(ctx: CanvasRenderingContext2D, p0: DOMPoint, p1: DOMPoint, scaleFactor: number): void {
        this.setLineStyle(ctx);

        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0, 0.8)";
        ctx.lineWidth = ctx.lineWidth + considerHiDPI(2);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        ctx.restore();


        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
    }

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);

        ctxWrapper.save();

        this.drawLine(ctx, p0, p1, scaleFactor);

        ctxWrapper.restore();

        if (this.active) {
            const scaledDeleteButtonSize = this.getControlElementImageScaledSize(img_delete_button, scaleFactor);
            const scaledMoveButtonSize = this.getControlElementImageScaledSize(img_move_button, scaleFactor);


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
            drawRotatedIcon(img_move_button, p1.x, p1.y, scaledMoveButtonSize);
        }

        this.rotationRemovalTransformationMatrix = new DOMMatrix().rotateFromVectorSelf(p1.y - p0.y,p1.x - p0.x);

        this.lineHitbox.topLeftBound = p0.matrixTransform(
            new DOMMatrix().translate(-lineHitboxPadding).multiply(this.rotationRemovalTransformationMatrix)
        );
        this.lineHitbox.bottomRightBound = p1.matrixTransform(
            new DOMMatrix().translate(lineHitboxPadding).multiply(this.rotationRemovalTransformationMatrix)
        );
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const scaledDeleteButtonSize = this.getControlElementImageScaledSize(img_delete_button, scaleFactor);
        const deleteButtonHitboxPadding = Math.max(scaledDeleteButtonSize.width, scaledDeleteButtonSize.height) / 2;
        const deleteButtonHitbox = calculateBoxAroundPoint(p0, deleteButtonHitboxPadding);

        const sTappedPoint = new DOMPoint(tappedPoint.x,tappedPoint.y).matrixTransform(this.rotationRemovalTransformationMatrix);

        if (this.active && isInsideBox(tappedPoint, deleteButtonHitbox)) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (isInsideBox(sTappedPoint, this.lineHitbox)) {
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

    translate(
        startCoordinates: PointCoordinates,
        lastCoordinates: PointCoordinates,
        currentCoordinates: PointCoordinates,
        transformationMatrixToScreenSpace : DOMMatrixInit,
        scaleFactor: number,
        pixelSize: number
    ) : StructureInterceptionHandlerResult {
        if (this.active) {
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);

            const scaledMoveButtonSize = this.getControlElementImageScaledSize(img_move_button, scaleFactor);
            const moveButtonHitboxPadding = Math.max(scaledMoveButtonSize.width, scaledMoveButtonSize.height) / 2;
            const moveButtonHitbox = calculateBoxAroundPoint(p1, moveButtonHitboxPadding);

            if (!this.isResizing && isInsideBox(lastCoordinates, moveButtonHitbox)) {
                this.isResizing = true;
            }

            const { dx, dy } = ClientStructure.calculateTranslateDelta(lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace);
            const sLast = new DOMPoint(lastCoordinates.x,lastCoordinates.y).matrixTransform(this.rotationRemovalTransformationMatrix);

            if (this.isResizing) {
                this.x1 += dx;
                this.y1 += dy;

                return {
                    stopPropagation: true
                };
            } else if (isInsideBox(sLast, this.lineHitbox)) {
                this.x0 += dx;
                this.y0 += dy;
                this.x1 += dx;
                this.y1 += dy;

                return {
                    stopPropagation: true
                };
            }
        }

        return {
            stopPropagation: false
        };
    }

    postProcess(): void {
        this.x0 = Math.round(this.x0);
        this.y0 = Math.round(this.y0);

        const deltaY = Math.abs(this.y0 - this.y1);
        const deltaX = Math.abs(this.x0 - this.x1);
        const distance = Math.hypot(deltaX, deltaY);
        const roundedDistance = Math.round(distance);

        // Ensure that the user doesn't create a wall that is too short to be modified anymore
        if (distance < 1) {
            if (this.x0 === this.x1 && this.y0 === this.y1) {
                this.x1++;
                this.y1++;
            } else {
                if (this.x0 > this.x1) {
                    this.x1--;
                } else if (this.x0 < this.x1) {
                    this.x1++;
                }
                if (this.y0 > this.y1) {
                    this.y1--;
                } else if (this.y0 < this.y1) {
                    this.y1++;
                }
            }

            return this.postProcess();
        }

        const angle = Math.atan2(deltaY, deltaX) * 180/Math.PI;
        const newAngle = (Math.round(angle/5)*5);

        let xOffset = roundedDistance * Math.cos(newAngle * Math.PI/180);
        let yOffset = roundedDistance * Math.sin(newAngle * Math.PI/180);


        if (this.x0 > this.x1) {
            xOffset = xOffset * -1;
        }

        if (this.y0 > this.y1) {
            yOffset = yOffset * -1;
        }

        this.x1 = this.x0 + xOffset;
        this.y1 = this.y0 + yOffset;
    }
}

export default LineClientStructure;
