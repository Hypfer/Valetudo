import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import moveButtonIconSVG from "../icons/move_zone.svg";
import {PointCoordinates, StructureInterceptionHandlerResult} from "../Structure";
import {Canvas2DContextTrackingWrapper} from "../../utils/Canvas2DContextTrackingWrapper";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_move_button = new Image();
img_move_button.src = moveButtonIconSVG;

const buttonHitbox = 22.5;
const lineHitbox = 22.5;

abstract class LineClientStructure extends ClientStructure {
    public static TYPE = "LineClientStructure";

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
    private leftLineHitboxBound: DOMPoint = new DOMPoint();
    private rightLineHitboxBound: DOMPoint = new DOMPoint();


    constructor(
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

    draw(ctxWrapper: Canvas2DContextTrackingWrapper, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);


        ctxWrapper.save();


        this.setLineStyle(ctx);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();


        ctxWrapper.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p0.x - img_delete_button.width / 2,
                p0.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_move_button,
                p1.x - img_move_button.width / 2,
                p1.y - img_move_button.height / 2
            );
        }

        this.rotationRemovalTransformationMatrix = new DOMMatrix().rotateFromVectorSelf(p1.y - p0.y,p1.x - p0.x);
        this.leftLineHitboxBound = p0.matrixTransform(
            new DOMMatrix().translate(-lineHitbox).multiply(this.rotationRemovalTransformationMatrix)
        );
        this.rightLineHitboxBound = p1.matrixTransform(
            new DOMMatrix().translate(lineHitbox).multiply(this.rotationRemovalTransformationMatrix)
        );
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p0.x, 2) + Math.pow(tappedPoint.y - p0.y, 2)
        );

        const sTappedPoint = new DOMPoint(tappedPoint.x,tappedPoint.y).matrixTransform(this.rotationRemovalTransformationMatrix);

        if (this.active && distanceFromDelete <= buttonHitbox) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (
            sTappedPoint.x >= this.leftLineHitboxBound.x &&
            sTappedPoint.x <= this.rightLineHitboxBound.x &&
            sTappedPoint.y >= this.leftLineHitboxBound.y &&
            sTappedPoint.y <= this.rightLineHitboxBound.y
        ) {
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

    translate(startCoordinates: PointCoordinates, lastCoordinates: PointCoordinates, currentCoordinates: PointCoordinates, transformationMatrixToScreenSpace : DOMMatrixInit) : StructureInterceptionHandlerResult {
        if (this.active) {
            const transformationMatrixToMapSpace = DOMMatrix.fromMatrix(transformationMatrixToScreenSpace).invertSelf();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(lastCoordinates.x - p1.x, 2) + Math.pow(lastCoordinates.y - p1.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= buttonHitbox) {
                this.isResizing = true;
            }

            const lastInMapSpace = new DOMPoint(lastCoordinates.x, lastCoordinates.y).matrixTransform(transformationMatrixToMapSpace);
            const currentInMapSpace = new DOMPoint(currentCoordinates.x, currentCoordinates.y).matrixTransform(transformationMatrixToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            const sLast = new DOMPoint(lastCoordinates.x,lastCoordinates.y).matrixTransform(this.rotationRemovalTransformationMatrix);

            if (distanceFromResize <= buttonHitbox) {
                this.x1 += dx;
                this.y1 += dy;

                return {
                    stopPropagation: true
                };
            } else if (
                sLast.x >= this.leftLineHitboxBound.x &&
                sLast.x <= this.rightLineHitboxBound.x &&
                sLast.y >= this.leftLineHitboxBound.y &&
                sLast.y <= this.rightLineHitboxBound.y
            ) {
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
        const distance = Math.round(Math.hypot(deltaX, deltaY));

        const angle = Math.atan2(deltaY, deltaX) * 180/Math.PI;
        const newAngle = (Math.round(angle/5)*5);

        let xOffset = distance * Math.cos(newAngle * Math.PI/180);
        let yOffset = distance * Math.sin(newAngle * Math.PI/180);


        if (this.x0 > this.x1) {
            xOffset = xOffset * -1;
        }

        if (this.y0 > this.y1) {
            yOffset = yOffset * -1;
        }

        this.x1 = this.x0 + xOffset;
        this.y1 = this.y0 + yOffset;
    }

    getType(): string {
        return LineClientStructure.TYPE;
    }
}

export default LineClientStructure;
