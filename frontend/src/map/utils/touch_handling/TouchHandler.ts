import {MapCanvasEvent} from "./MapCanvasEvent";
import {NoGesture} from "./gestures/NoGesture";
import {Gesture} from "./gestures/Gesture";
import {PossibleTapGesture} from "./gestures/PossibleTapGesture";
import {TouchHandlerEvent} from "./events/TouchHandlerEvent";
import {OngoingPanGesture} from "./gestures/OngoingPanGesture";
import {PinchEndTouchHandlerEvent} from "./events/PinchEndTouchHandlerEvent";
import {OngoingPinchGesture} from "./gestures/OngoingPinchGesture";
import {UserEvent} from "./TouchHandlingUtils";


export class TouchHandler extends EventTarget {
    private trackedElement: HTMLCanvasElement;
    private currentGesture: Gesture;

    constructor(trackedElement :HTMLCanvasElement) {
        super();
        this.currentGesture = new NoGesture();

        this.trackedElement = trackedElement;

        this.registerListeners();
    }

    private registerListeners() {
        [
            "mousedown",
            "touchstart"
        ].forEach(evtType => {
            // @ts-ignore
            this.trackedElement.addEventListener(evtType, (evt: UserEvent) => {
                this.handleStartEvent(evt, MapCanvasEvent.CREATE_EVENTS(evt));
            });
        });

        [
            "mousemove",
            "touchmove"
        ].forEach(evtType => {
            // @ts-ignore
            this.trackedElement.addEventListener(evtType, (evt: UserEvent) => {
                this.handleOngoingEvent(evt, MapCanvasEvent.CREATE_EVENTS(evt));
            });
        });

        [
            "mouseup",
            "mouseleave",
            "mouseout",
            "touchcancel",
            "touchend"
        ].forEach(evtType => {
            // @ts-ignore
            this.trackedElement.addEventListener(evtType, (evt: UserEvent) => {
                this.handleEndEvent(evt, MapCanvasEvent.CREATE_EVENTS(evt));
            });
        });
    }


    private handleStartEvent(rawEvt : UserEvent, mapCanvasEvents: Array<MapCanvasEvent>) {
        rawEvt.stopPropagation();
        rawEvt.preventDefault();


        if (mapCanvasEvents.length >= 2) {
            this.currentGesture = new OngoingPinchGesture(mapCanvasEvents[0], mapCanvasEvents[1]);
        } else if (this.currentGesture instanceof NoGesture) {
            this.currentGesture = new PossibleTapGesture(mapCanvasEvents[0]);
        } else if (this.currentGesture instanceof PossibleTapGesture || this.currentGesture instanceof OngoingPanGesture) { //upgrade to pinch
            this.currentGesture = new OngoingPinchGesture(this.currentGesture.getLastEvent(), mapCanvasEvents[0]);
        }



        const result = this.currentGesture.handleStartEvent(rawEvt, mapCanvasEvents);

        if (result === false) {
            this.currentGesture = new NoGesture();
        } else if (result instanceof TouchHandlerEvent) {
            this.dispatchEvent(result);
        }
    }

    private handleOngoingEvent(rawEvt : UserEvent, mapCanvasEvents: Array<MapCanvasEvent>) {
        rawEvt.stopPropagation();
        rawEvt.preventDefault();

        const result = this.currentGesture.handleOngoingEvent(rawEvt, mapCanvasEvents);

        if (result === false) {
            if (this.currentGesture instanceof PossibleTapGesture) { //upgrade tap to pan
                this.currentGesture = new OngoingPanGesture(this.currentGesture.getLastEvent());

                const result2 = this.currentGesture.handleStartEvent(rawEvt, mapCanvasEvents);
                if (result2 instanceof TouchHandlerEvent) {
                    this.dispatchEvent(result2);
                }
            }
        } else if (result instanceof TouchHandlerEvent) {
            this.dispatchEvent(result);
        }

    }

    private handleEndEvent(rawEvt : UserEvent, mapCanvasEvents: Array<MapCanvasEvent>) {
        rawEvt.stopPropagation();
        rawEvt.preventDefault();

        const result = this.currentGesture.handleEndEvent(rawEvt, mapCanvasEvents);

        if (result === false) {
            this.currentGesture = new NoGesture();
        } else if (result instanceof TouchHandlerEvent) {
            this.dispatchEvent(result);

            if (result instanceof PinchEndTouchHandlerEvent) {
                this.currentGesture = new OngoingPanGesture(new MapCanvasEvent(result.x0, result.y0, result.pointerId));

                const result2 = this.currentGesture.handleStartEvent(rawEvt, mapCanvasEvents);
                if (result2 instanceof TouchHandlerEvent) {
                    this.dispatchEvent(result2);
                }
            } else {
                this.currentGesture = new NoGesture();
            }
        }
    }
}

