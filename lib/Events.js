const {EventEmitter} = require("events");

class Events {
    constructor() {
        /** @private */
        this.eventEmitter = new EventEmitter();
    }

    emitMapUpdated() {
        this.eventEmitter.emit(Events.MapUpdated);
    }

    /**
     * @param {() => void} listener
     */
    onMapUpdated(listener) {
        this.eventEmitter.on(Events.MapUpdated, listener);
    }

    /**
     * @param {import("./miio/Status")} status
     */
    emitStatusUpdated(status) {
        this.eventEmitter.emit(Events.StatusUpdated, status);
    }

    /**
     * @param {(status: import("./miio/Status")) => void} listener
     */
    onStatusUpdated(listener) {
        this.eventEmitter.on(Events.StatusUpdated, listener);
    }
}

Events.MapUpdated = "MapUpdated";
Events.StatusUpdated = "StatusUpdated";

module.exports = Events;