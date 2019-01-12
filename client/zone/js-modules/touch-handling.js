function distance([x1, y1], [x2, y2]) {
    return Math.sqrt(
        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
    );
}

class NoGesture {
    constructor() {}
    updatePointerPosition(evts) {}
    removePointer(evt) {
        return this;
    }
}

class PossibleTap {
    constructor(pointerDownEvent, dispatchEvent) {
        this.tapTolerance = 5;
        this.pointerId = pointerDownEvent.pointerId;
        this.pointerDownPosition = [pointerDownEvent.clientX, pointerDownEvent.clientY];
        this.lastPosition = [pointerDownEvent.clientX, pointerDownEvent.clientY];

        this.dispatchEvent = dispatchEvent;
    }

    toleranceExeeded() {
        return distance(this.lastPosition, this.pointerDownPosition) > this.tapTolerance;
    }

    updatePointerPosition(evts) {
        this.lastPosition = [evts[0].clientX, evts[0].clientY];
    }

    removePointer(evt) {
        if(evt.pointerId === this.pointerId) {
            const tapEvent = new Event("tap");
            tapEvent.tappedCoordinates = {x: this.pointerDownPosition[0], y: this.pointerDownPosition[1]};
            this.dispatchEvent(tapEvent);

            return new NoGesture();
        } else {
            return this;
        }
    }
}

class OngoingPan {
    constructor(pointerId, [pointerDownX, pointerDownY], [currentX, currentY], dispatchEvent) {
        this.pointerId = pointerId;
        this.pointerDownPosition = [pointerDownX, pointerDownY];
        this.lastPosition = [currentX, currentY];

        this.dispatchEvent = dispatchEvent;

        const panStartEvent = new Event("panstart");
        panStartEvent.coordinates = {x: this.pointerDownPosition[0], y: this.pointerDownPosition[1]};
        this.dispatchEvent(panStartEvent);
    }

    updatePointerPosition(evts) {
        this.lastPosition = [evts[0].clientX, evts[0].clientY];

        const panMoveEvent = new Event("panmove");
        panMoveEvent.startCoordinates = {x: this.pointerDownPosition[0], y: this.pointerDownPosition[1]};
        panMoveEvent.currentCoordinates = {x: evts[0].clientX, y: evts[0].clientY};
        this.dispatchEvent(panMoveEvent);
    }

    removePointer(evt) {
        if(evt.pointerId === this.pointerId) {
            const panEndEvent = new Event("panend");
            panEndEvent.startCoordinates = {x: this.pointerDownPosition[0], y: this.pointerDownPosition[1]};
            panEndEvent.currentCoordinates = {x: evt.clientX, y: evt.clientY};
            this.dispatchEvent(panEndEvent);

            return new NoGesture();
        } else {
            return this;
        }
    }
}

class OngoingPinch {
    constructor(pointerId, [pointerDownX, pointerDownY], secondPointerDownEvent, dispatchEvent) {
        this.tapTolerance = 5;
        this.pointerId = pointerId;
        this.pointerDownPosition = [pointerDownX, pointerDownY];
        this.lastPosition = [pointerDownX, pointerDownY];
        this.pointer2Id = secondPointerDownEvent.pointerId;
        this.pointer2DownPosition = [secondPointerDownEvent.clientX, secondPointerDownEvent.clientY];
        this.lastPosition2 = [secondPointerDownEvent.clientX, secondPointerDownEvent.clientY];

        this.dispatchEvent = dispatchEvent;

        const pinchStartEvent = new Event("pinchstart");
        pinchStartEvent.distance = distance(this.pointerDownPosition, this.pointer2DownPosition);
        pinchStartEvent.scale = 1;
        pinchStartEvent.center = {
            x: (this.pointerDownPosition[0] + this.pointer2DownPosition[0]) / 2,
            y: (this.pointerDownPosition[1] + this.pointer2DownPosition[1]) / 2
        }
        this.dispatchEvent(pinchStartEvent);
    }

    updatePointerPosition(evts) {
        for(let evt of evts) {
            if(evt.pointerId === this.pointerId) {
                this.lastPosition = [evt.clientX, evt.clientY];
            } else if (evt.pointerId === this.pointer2Id) {
                this.lastPosition2 = [evt.clientX, evt.clientY];
            }
        }

        const pinchMoveEvent = new Event("pinchmove");
        pinchMoveEvent.distance = distance(this.lastPosition, this.lastPosition2);
        pinchMoveEvent.scale = pinchMoveEvent.distance / distance(this.pointerDownPosition, this.pointer2DownPosition);
        pinchMoveEvent.center = {
            x: (this.lastPosition[0] + this.lastPosition2[0]) / 2,
            y: (this.lastPosition[1] + this.lastPosition2[1]) / 2
        }

        this.dispatchEvent(pinchMoveEvent);
    }

    removePointer(evt) {
        if(evt.pointerId === this.pointerId) {
            this.dispatchEvent(new Event("pinchend"));
            return new OngoingPan(
                this.pointer2Id,
                this.lastPosition2,
                this.lastPosition2,
                this.dispatchEvent
            );
        } else if (evt.pointerId === this.pointer2Id) {
            this.dispatchEvent(new Event("pinchend"));
            return new OngoingPan(
                this.pointerId,
                this.lastPosition,
                this.lastPosition,
                this.dispatchEvent
            );
        } else {
            return this;
        }
    }
}

export class TouchHandler {
    /**
     * @param {HTMLElement} trackedElement
     */
    constructor(trackedElement) {
        this.trackedElement = trackedElement;
        this.trackedElement.addEventListener("mousedown", e => this.pointerDown(e, this.touchChangesFromMouseEvent(e)));
        this.trackedElement.addEventListener("mousemove", e => this.pointerMove(e, this.touchChangesFromMouseEvent(e)));
        this.trackedElement.addEventListener("mouseup", e => this.pointerUp(e, this.touchChangesFromMouseEvent(e)));
        this.trackedElement.addEventListener("mouseleave", e => this.pointerUp(e, this.touchChangesFromMouseEvent(e)));
        this.trackedElement.addEventListener("mouseout", e => this.pointerUp(e, this.touchChangesFromMouseEvent(e)));

        this.trackedElement.addEventListener("touchstart", e => this.pointerDown(e, this.touchChangesFromTouchEvent(e)));
        this.trackedElement.addEventListener("touchmove", e => this.pointerMove(e, this.touchChangesFromTouchEvent(e)));
        this.trackedElement.addEventListener("touchcancel", e => this.pointerUp(e, this.touchChangesFromTouchEvent(e)));
        this.trackedElement.addEventListener("touchend", e => this.pointerUp(e, this.touchChangesFromTouchEvent(e)));

        this.ongoingGesture = new NoGesture();
    }


    touchChangesFromMouseEvent(evt) {
        return [{
            clientX: evt.clientX,
            clientY: evt.clientY,
            pointerId: 0
        }];
    }

    touchChangesFromTouchEvent(evt) {
        const changedTouches = []

        for(let touch of evt.changedTouches) {
            changedTouches.push({
                clientX: touch.clientX,
                clientY: touch.clientY,
                pointerId: touch.identifier
            });
        }

        return changedTouches;
    }

    pointerDown(evt, changedTouches) {
        evt.stopPropagation();
        evt.preventDefault();

        if(this.ongoingGesture instanceof NoGesture) {
            this.ongoingGesture = new PossibleTap(changedTouches[0], this.trackedElement.dispatchEvent.bind(this.trackedElement));

        } else if(this.ongoingGesture instanceof PossibleTap || this.ongoingGesture instanceof OngoingPan) {
            this.ongoingGesture = new OngoingPinch(
                this.ongoingGesture.pointerId,
                // start the pinch with the first pointer at the current position
                // (when the second pointer was added)
                this.ongoingGesture.lastPosition,
                changedTouches[0],
                this.trackedElement.dispatchEvent.bind(this.trackedElement)
            );
        }
    }

    pointerMove(evt, changedTouches) {
        evt.stopPropagation();
        evt.preventDefault();

        this.ongoingGesture.updatePointerPosition(changedTouches);

        // Upgrade Tap to a Pan if the movement tolerance is exeeded
        if(this.ongoingGesture instanceof PossibleTap && this.ongoingGesture.toleranceExeeded()) {
            this.ongoingGesture = new OngoingPan(
                this.ongoingGesture.pointerId,
                this.ongoingGesture.pointerDownPosition,
                this.ongoingGesture.lastPosition,
                this.trackedElement.dispatchEvent.bind(this.trackedElement)
            )
        }
    }

    pointerUp(evt, changedTouches) {
        evt.stopPropagation();
        evt.preventDefault();

        this.ongoingGesture = this.ongoingGesture.removePointer(changedTouches[0]);
    }
}