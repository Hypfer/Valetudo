import {TouchHandlerEvent} from "./TouchHandlerEvent";

export class PinchEndTouchHandlerEvent extends TouchHandlerEvent {
    static TYPE = "pinch_end";

    x0: number;
    y0: number;
    pointerId: number;


    constructor(x0: number, y0: number, pointerId: number) {
        super(PinchEndTouchHandlerEvent.TYPE);

        this.x0 = x0;
        this.y0 = y0;
        this.pointerId = pointerId;
    }

}
