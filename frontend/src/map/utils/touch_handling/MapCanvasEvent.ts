import {UserEvent} from "./TouchHandlingUtils";

export class MapCanvasEvent {
    x: number;
    y: number;
    pointerId: number;

    constructor(x: number, y : number, pointerId : number) {
        this.x = x;
        this.y = y;
        this.pointerId = pointerId;
    }

    static CREATE_EVENTS_FROM_MOUSE_EVENT(evt : MouseEvent) : Array<MapCanvasEvent> {
        return [
            new MapCanvasEvent(evt.clientX, evt.clientY, 0)
        ];
    }

    static CREATE_EVENTS_FROM_TOUCH_EVENT(evt: TouchEvent) : Array<MapCanvasEvent> {
        const events = [];

        for (const touch of evt.changedTouches) {
            events.push(new MapCanvasEvent(touch.clientX, touch.clientY, touch.identifier));
        }

        return events;
    }

    static CREATE_EVENTS(evt: UserEvent) : Array<MapCanvasEvent> {
        if (evt instanceof MouseEvent) {
            return MapCanvasEvent.CREATE_EVENTS_FROM_MOUSE_EVENT(evt);
        } else if (evt instanceof TouchEvent) {
            return MapCanvasEvent.CREATE_EVENTS_FROM_TOUCH_EVENT(evt);
        } else {
            throw new Error("Unknown event type");
        }
    }
}
