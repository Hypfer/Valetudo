import {Gesture} from "./Gesture";
import {MapCanvasEvent} from "../MapCanvasEvent";
import {UserEvent} from "../TouchHandlingUtils";

export class NoGesture extends Gesture {
    handleOngoingEvent(rawEvt : UserEvent, evts: Array<MapCanvasEvent>): void {
        /* intentional */
    }
}
