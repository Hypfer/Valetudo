import {Gesture, GestureEventHandlingResult} from "./Gesture";
import {MapCanvasEvent} from "../MapCanvasEvent";
import {PanStartTouchHandlerEvent} from "../events/PanStartTouchHandlerEvent";
import {PanMoveTouchHandlerEvent} from "../events/PanMoveTouchHandlerEvent";
import {PanEndTouchHandlerEvent} from "../events/PanEndTouchHandlerEvent";
import {UserEvent} from "../TouchHandlingUtils";

export class OngoingPanGesture extends Gesture {
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

    handleStartEvent(rawEvt: UserEvent, evts: Array<MapCanvasEvent>): GestureEventHandlingResult {
        return new PanStartTouchHandlerEvent(this.initialPosition.x, this.initialPosition.y);
    }


    handleOngoingEvent(rawEvt : UserEvent, evts: Array<MapCanvasEvent>): GestureEventHandlingResult {
        for (const event of evts) {
            if (event.pointerId === this.pointerId) {
                this.lastEvent = event;
                this.lastPosition.x = event.x;
                this.lastPosition.y = event.y;

                return new PanMoveTouchHandlerEvent(
                    this.initialPosition.x,
                    this.initialPosition.y,
                    this.lastPosition.x,
                    this.lastPosition.y
                );
            }
        }
    }

    handleEndEvent(rawEvt : UserEvent, evts : Array<MapCanvasEvent>) : GestureEventHandlingResult {
        for (const event of evts) {
            if (event.pointerId === this.pointerId) {
                this.lastPosition.x = event.x;
                this.lastPosition.y = event.y;

                return new PanEndTouchHandlerEvent(
                    this.initialPosition.x,
                    this.initialPosition.y,
                    this.lastPosition.x,
                    this.lastPosition.y
                );
            }
        }
    }

    getInitialEvent() {
        return this.initialEvent;
    }

    getLastEvent() {
        return this.lastEvent;
    }

}
