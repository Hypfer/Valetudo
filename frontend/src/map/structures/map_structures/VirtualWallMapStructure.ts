import MapStructure from "./MapStructure";


class VirtualWallMapStructure extends MapStructure {
    public static TYPE = "VirtualWallMapStructure";

    private x1: number;
    private y1: number;


    constructor(
        x0: number, y0: number,
        x1: number, y1: number
    ) {
        super(x0, y0);

        this.x1 = x1;
        this.y1 = y1;
    }

    draw(ctx: CanvasRenderingContext2D, transformationMatrixToScreenSpace: DOMMatrixInit, scaleFactor: number): void {
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformationMatrixToScreenSpace);


        ctx.save();


        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();


        ctx.restore();
    }

    getType(): string {
        return VirtualWallMapStructure.TYPE;
    }
}

export default VirtualWallMapStructure;
