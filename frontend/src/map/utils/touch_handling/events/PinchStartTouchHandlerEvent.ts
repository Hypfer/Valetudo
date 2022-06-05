import {TouchHandlerEvent} from "./TouchHandlerEvent";

export class PinchStartTouchHandlerEvent extends TouchHandlerEvent {
    static TYPE = "pinch_start";

    x0: number;
    y0: number;
    distance: number;
    scale: number;

    constructor(x0: number, y0: number, distance: number, scale: number) {
        super(PinchStartTouchHandlerEvent.TYPE);

        this.x0 = x0;
        this.y0 = y0;

        this.distance = distance;
        this.scale = scale;
    }

}
