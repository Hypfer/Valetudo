import {Gesture} from "./Gesture";
import {MapCanvasEvent} from "../MapCanvasEvent";

export class NoGesture extends Gesture {
    handleOngoingEvent(rawEvt : MouseEvent | TouchEvent, evts: Array<MapCanvasEvent>): void {
        /* intentional */
    }
}
