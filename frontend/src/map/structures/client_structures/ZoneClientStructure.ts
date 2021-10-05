import ClientStructure from "./ClientStructure";
import deleteButtonIconSVG from "../icons/delete_zone.svg";
import scaleButtonIconSVG from "../icons/scale_zone.svg";
import {PointCoordinates, StructureInterceptionHandlerResult} from "../Structure";

const img_delete_button = new Image();
img_delete_button.src = deleteButtonIconSVG;

const img_scale_button = new Image();
img_scale_button.src = scaleButtonIconSVG;

const buttonSize = 30;

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

    draw(ctx: CanvasRenderingContext2D, transformationMatrixToMapSpace: DOMMatrixInit, scaleFactor: number): void {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToMapSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToMapSpace);

        const dimensions = { //TODO: this division is still weird. Why? Does this refer to the pixelSize?
            x: (Math.round(this.x1) - Math.round(this.x0)) / 20,
            y: (Math.round(this.y1) - Math.round(this.y0)) / 20
        };
        const label = dimensions.x.toFixed(1) + " x " + dimensions.y.toFixed(1) + "m";

        ctx.save();
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
        ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
        ctx.restore();

        ctx.save();
        ctx.textAlign = "start";
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.font = Math.round(6 * scaleFactor).toString(10) + "px sans-serif";
        ctx.fillText(label, p0.x, p0.y - 4);
        ctx.strokeText(label, p0.x, p0.y - 4);

        ctx.restore();

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

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p1.x, 2) + Math.pow(tappedPoint.y - p0.y, 2)
        );

        if (this.active && distanceFromDelete <= buttonSize / 2) {
            return {
                deleteMe: true,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p0.x &&
            tappedPoint.x <= p1.x &&
            tappedPoint.y >= p0.y &&
            tappedPoint.y <= p1.y
        ) {
            this.active = true;

            return {
                stopPropagation: true
            };
        } else {
            this.active = false;
        }

        return {
            stopPropagation: false
        };
    }

    translate(startCoordinates: PointCoordinates, lastCoordinates: PointCoordinates, currentCoordinates: PointCoordinates, transformationMatrixToScreenSpace : DOMMatrixInit) : StructureInterceptionHandlerResult {
        if (this.active) {
            const transformationMatrixToMapSpace = DOMMatrix.fromMatrix(transformationMatrixToScreenSpace).invertSelf();
            const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
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

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x0 + 5 && this.x1 + dx > this.x0 + 5) {
                    this.x1 += dx;
                }
                if (currentInMapSpace.y > this.y0 + 5 && this.y1 + dy > this.y0 + 5) {
                    this.y1 += dy;
                }

                return {
                    stopPropagation: true
                };
            } else if (
                lastCoordinates.x >= p0.x &&
                lastCoordinates.x <= p1.x &&
                lastCoordinates.y >= p0.y &&
                lastCoordinates.y <= p1.y
            ) {
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
