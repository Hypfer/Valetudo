import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import moveButtonIconSVG from "../icons/move_zone.svg";
import {PointCoordinates, StructureInterceptionHandlerResult} from "../Structure";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_move_button = new Image();
img_move_button.src = moveButtonIconSVG;

const buttonSize = 30;

class CuttingLineClientStructure extends ClientStructure {
    public static TYPE = "CuttingLineClientStructure";

    public x1: number;
    public y1: number;

    //TODO: someone capable of math and therefore understanding these should give them better names
    private matrix: DOMMatrix = new DOMMatrix();
    private sp0: DOMPoint = new DOMPoint();
    private sp1: DOMPoint = new DOMPoint();


    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        active?: boolean
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;

        this.active = active ?? true;
    }

    draw(ctx: CanvasRenderingContext2D, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);


        ctx.save();


        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        if (this.active) {
            ctx.setLineDash([15, 5]);
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();


        ctx.restore();

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

        this.matrix = new DOMMatrix().rotateFromVectorSelf(p1.y - p0.y,p1.x - p0.x);
        this.sp0 = p0.matrixTransform(new DOMMatrix().translate(-10).rotateFromVectorSelf(p1.y - p0.y,p1.x - p0.x));
        this.sp1 = p1.matrixTransform(new DOMMatrix().translate(+10).rotateFromVectorSelf(p1.y - p0.y,p1.x - p0.x));
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p0.x, 2) + Math.pow(tappedPoint.y - p0.y, 2)
        );

        const sTappedPoint = new DOMPoint(tappedPoint.x,tappedPoint.y).matrixTransform(this.matrix);

        if (this.active && distanceFromDelete <= buttonSize / 2) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (
            sTappedPoint.x >= this.sp0.x &&
            sTappedPoint.x <= this.sp1.x &&
            sTappedPoint.y >= this.sp0.y &&
            sTappedPoint.y <= this.sp1.y
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
            if (!this.isResizing && distanceFromResize <= buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new DOMPoint(lastCoordinates.x, lastCoordinates.y).matrixTransform(transformationMatrixToMapSpace);
            const currentInMapSpace = new DOMPoint(currentCoordinates.x, currentCoordinates.y).matrixTransform(transformationMatrixToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            const sLast = new DOMPoint(lastCoordinates.x,lastCoordinates.y).matrixTransform(this.matrix);

            if (distanceFromResize <= buttonSize / 2) {
                this.x1 += dx;
                this.y1 += dy;

                return {
                    stopPropagation: true
                };
            } else if (
                sLast.x >= this.sp0.x &&
                sLast.x <= this.sp1.x &&
                sLast.y >= this.sp0.y &&
                sLast.y <= this.sp1.y
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
        return CuttingLineClientStructure.TYPE;
    }
}

export default CuttingLineClientStructure;
