import {TouchHandlerEvent} from "./TouchHandlerEvent";

export class PanMoveTouchHandlerEvent extends TouchHandlerEvent {
    static TYPE = "pan_move";

    x0: number;
    y0: number;

    x1: number;
    y1: number;

    constructor(x0: number, y0: number, x1: number, y1: number) {
        super(PanMoveTouchHandlerEvent.TYPE);

        this.x0 = x0;
        this.y0 = y0;

        this.x1 = x1;
        this.y1 = y1;
    }

}
