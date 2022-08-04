import LineClientStructure from "./LineClientStructure";

class CuttingLineClientStructure extends LineClientStructure {
    public static TYPE = "CuttingLineClientStructure";

    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        active?: boolean
    ) {
        super(
            x0, y0,
            x1, y1,
            active ?? true
        );
    }

    protected setLineStyle(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        if (this.active) {
            ctx.setLineDash([15, 5]);
        }
    }

    getType(): string {
        return CuttingLineClientStructure.TYPE;
    }
}

export default CuttingLineClientStructure;
