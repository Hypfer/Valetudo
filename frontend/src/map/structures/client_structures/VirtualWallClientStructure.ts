import LineClientStructure from "./LineClientStructure";

class VirtualWallClientStructure extends LineClientStructure {
    public static TYPE = "VirtualWallClientStructure";

    constructor(
        x0: number, y0: number,
        x1: number, y1: number,
        active?: boolean
    ) {
        super(
            x0, y0,
            x1, y1,
            active ?? false
        );
    }

    protected setLineStyle(ctx: CanvasRenderingContext2D) {
        ctx.shadowColor = "rgba(0,0,0, 1)";
        ctx.shadowBlur = 2;

        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        if (this.active) {
            ctx.setLineDash([15, 5]);
        }
    }

    getType(): string {
        return VirtualWallClientStructure.TYPE;
    }
}

export default VirtualWallClientStructure;
