import {MapCanvasEvent} from "../MapCanvasEvent";
import {TouchHandlerEvent} from "../events/TouchHandlerEvent";
import {UserEvent} from "../TouchHandlingUtils";

export type GestureEventHandlingResult = TouchHandlerEvent | false | void;

export abstract class Gesture {

    /*
     * Returns an event if the gesture is ongoing
     * May also return false if the gesture doesn't apply anymore
     * Also, may return void if the gesture still applies but there's no event yet
     */
    handleStartEvent(rawEvt : UserEvent, evts : Array<MapCanvasEvent>) : GestureEventHandlingResult {
        return;
    }

    /*
     * Returns an event if the gesture is ongoing
     * May also return false if the gesture doesn't apply anymore
     * Also, may return void if the gesture still applies but there's no event yet
     */
    abstract handleOngoingEvent(rawEvt : UserEvent, evts : Array<MapCanvasEvent>) : GestureEventHandlingResult

    /*
     * Returns an event if the gesture is done
     * May also return false if the gesture doesn't apply anymore
     * Also, may return void if the gesture still applies but there's no event just yet
     */
    handleEndEvent(rawEvt : UserEvent, evts : Array<MapCanvasEvent>): GestureEventHandlingResult {
        return;
    }
}
