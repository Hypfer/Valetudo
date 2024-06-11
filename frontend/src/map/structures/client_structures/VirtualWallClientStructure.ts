import LineClientStructure from "./LineClientStructure";
import {considerHiDPI} from "../../utils/helpers";

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
        ctx.shadowBlur = considerHiDPI(2);

        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.lineWidth = considerHiDPI(5);
        ctx.lineCap = "round";

        if (this.active) {
            ctx.setLineDash([
                considerHiDPI(15),
                considerHiDPI(5)
            ]);
        }
    }

    getType(): string {
        return VirtualWallClientStructure.TYPE;
    }
}

export default VirtualWallClientStructure;
