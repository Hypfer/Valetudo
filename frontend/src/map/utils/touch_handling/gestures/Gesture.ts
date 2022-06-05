import {MapCanvasEvent} from "../MapCanvasEvent";
import {TouchHandlerEvent} from "../events/TouchHandlerEvent";

export abstract class Gesture {

    /*
     * Returns an event if the gesture is ongoing
     * May also return false if the gesture doesn't apply anymore
     * Also, may return void if the gesture still applies but there's no event yet
     */
    handleStartEvent(rawEvt : MouseEvent | TouchEvent, evts : Array<MapCanvasEvent>) : TouchHandlerEvent | false | void {
        return;
    }

    /*
     * Returns an event if the gesture is ongoing
     * May also return false if the gesture doesn't apply anymore
     * Also, may return void if the gesture still applies but there's no event yet
     */
    abstract handleOngoingEvent(rawEvt : MouseEvent | TouchEvent, evts : Array<MapCanvasEvent>) : TouchHandlerEvent | false | void

    /*
     * Returns an event if the gesture is done
     * May also return false if the gesture doesn't apply anymore
     * Also, may return void if the gesture still applies but there's no event just yet
     */
    handleEndEvent(rawEvt : MouseEvent | TouchEvent, evts : Array<MapCanvasEvent>): TouchHandlerEvent | false | void {
        return;
    }
}
