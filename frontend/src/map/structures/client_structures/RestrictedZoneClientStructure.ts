import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import scaleButtonIconSVG from "../icons/scale_zone.svg";
import {PointCoordinates, StructureInterceptionHandlerResult} from "../Structure";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_scale_button = new Image();
img_scale_button.src = scaleButtonIconSVG;

const buttonSize = 30;

abstract class RestrictedZoneClientStructure extends ClientStructure {
    public static TYPE = "RestrictedZoneClientStructure";

    protected activeStyle : {
        stroke: string,
        fill: string,
    } = {
        stroke: "rgb(0, 255, 0)",
        fill: "rgba(0, 255, 0, 0)"
    };

    protected style : {
        stroke: string,
        fill: string,
    } = {
        stroke: "rgb(0, 255, 0)",
        fill: "rgba(0, 255, 0, 0.4)"
    };

    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;
    public x3: number;
    public y3: number;

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

    draw(ctx: CanvasRenderingContext2D, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformationMatrixToScreenSpace);


        ctx.save();

        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        if (!this.active) {
            ctx.strokeStyle = this.style.stroke;
            ctx.fillStyle = this.style.fill;
        } else {
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = this.style.stroke;
            ctx.fillStyle = this.style.fill;
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.fill();

        ctx.shadowColor = "rgba(0,0,0, 1)";
        ctx.shadowBlur = 2;

        ctx.stroke();


        ctx.restore();


        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p1.x - img_delete_button.width / 2,
                p1.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p2.x - img_scale_button.width / 2,
                p2.y - img_scale_button.height / 2
            );
        }
    }

    postProcess(): void {
        this.x0 = Math.round(this.x0);
        this.y0 = Math.round(this.y0);

        this.x1 = Math.round(this.x1);
        this.y1 = Math.round(this.y1);

        this.x2 = Math.round(this.x2);
        this.y2 = Math.round(this.y2);

        this.x3 = Math.round(this.x3);
        this.y3 = Math.round(this.y3);
    }

    tap(tappedPoint : PointCoordinates, transformationMatrixToScreenSpace: DOMMatrixInit) : StructureInterceptionHandlerResult {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p1.x, 2) + Math.pow(tappedPoint.y - p1.y, 2)
        );

        if (this.active && distanceFromDelete <= buttonSize / 2) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p0.x &&
            tappedPoint.x <= p2.x &&
            tappedPoint.y >= p0.y &&
            tappedPoint.y <= p2.y
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

    translate(startCoordinates: PointCoordinates, lastCoordinates: PointCoordinates, currentCoordinates: PointCoordinates, transformationMatrixToScreenSpace : DOMMatrixInit, pixelSize: number) : StructureInterceptionHandlerResult {
        if (this.active) {
            const transformationMatrixToMapSpace = DOMMatrix.fromMatrix(transformationMatrixToScreenSpace).invertSelf();
            const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformationMatrixToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(lastCoordinates.x - p2.x, 2) + Math.pow(lastCoordinates.y - p2.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new DOMPoint(lastCoordinates.x, lastCoordinates.y).matrixTransform(transformationMatrixToMapSpace);
            const currentInMapSpace = new DOMPoint(currentCoordinates.x, currentCoordinates.y).matrixTransform(transformationMatrixToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x0 + pixelSize && this.x1 + dx > this.x0 + pixelSize) {
                    this.x1 += dx;
                    this.x2 += dx;
                }
                if (currentInMapSpace.y > this.y0 + pixelSize && this.y2 + dy > this.y0 + pixelSize) {
                    this.y2 += dy;
                    this.y3 += dy;
                }

                return {
                    stopPropagation: true
                };
            } else if (
                lastCoordinates.x >= p0.x &&
                lastCoordinates.x <= p2.x &&
                lastCoordinates.y >= p0.y &&
                lastCoordinates.y <= p2.y
            ) {
                this.x0 += dx;
                this.y0 += dy;
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;
                this.x3 += dx;
                this.y3 += dy;

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
        return RestrictedZoneClientStructure.TYPE;
    }
}

export default RestrictedZoneClientStructure;
