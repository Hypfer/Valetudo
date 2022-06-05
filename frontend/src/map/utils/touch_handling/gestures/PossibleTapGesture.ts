import { Gesture } from "./Gesture";
import {MapCanvasEvent} from "../MapCanvasEvent";
import {TapTouchHandlerEvent} from "../events/TapTouchHandlerEvent";
import {TouchHandlerEvent} from "../events/TouchHandlerEvent";
import {distance2d} from "../TouchHandlingUtils";

export class PossibleTapGesture extends Gesture {
    private pointerId: number;
    private initialPosition: { x: number; y: number };
    private lastPosition: { x: number; y: number };
    private initialEvent: MapCanvasEvent;
    private lastEvent: MapCanvasEvent;

    constructor(event: MapCanvasEvent) {
        super();

        this.initialEvent = event;
        this.lastEvent = event;

        this.pointerId = event.pointerId;
        this.initialPosition = {
            x: event.x,
            y: event.y
        };
        this.lastPosition = {
            x: event.x,
            y: event.y
        };
    }

    handleStartEvent(rawEvt : MouseEvent | TouchEvent, evts: Array<MapCanvasEvent>): TouchHandlerEvent | void | false {
        //Ignore every mouse button that isn't just a regular click
        if (rawEvt instanceof MouseEvent && rawEvt.type === "mousedown" && rawEvt.button !== 0) {
            return false;
        }
    }


    handleOngoingEvent(rawEvt : MouseEvent | TouchEvent, evts: Array<MapCanvasEvent>): TouchHandlerEvent | void | false {
        const event = evts[0];

        this.lastEvent = event;
        this.lastPosition.x = event.x;
        this.lastPosition.y = event.y;

        const distance = distance2d(
            this.initialPosition.x,
            this.initialPosition.y,
            this.lastPosition.x,
            this.lastPosition.y
        );

        //If the pointer moved too much, it's not a tap anymore
        if (distance > 5) {
            return false;
        }
    }

    handleEndEvent(rawEvt : MouseEvent | TouchEvent, evts : Array<MapCanvasEvent>) : TouchHandlerEvent | void | false {
        const event = evts[0];

        if (event.pointerId === this.pointerId) {
            return new TapTouchHandlerEvent(this.initialPosition.x, this.initialPosition.y);
        } else {
            return;
        }
    }

    getInitialEvent() {
        return this.initialEvent;
    }

    getLastEvent() {
        return this.lastEvent;
    }
}
