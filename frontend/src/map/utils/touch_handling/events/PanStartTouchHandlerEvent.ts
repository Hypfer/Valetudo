import {TouchHandlerEvent} from "./TouchHandlerEvent";

export class PanStartTouchHandlerEvent extends TouchHandlerEvent {
    static TYPE = "pan_start";

    x0: number;
    y0: number;

    constructor(x0: number, y0: number) {
        super(PanStartTouchHandlerEvent.TYPE);

        this.x0 = x0;
        this.y0 = y0;
    }

}
