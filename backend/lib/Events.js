const EventEmitter = require("events").EventEmitter;

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
     * @param {import("./entities/state/RobotState")} status
     */
    emitStatusUpdated(status) {
        this.eventEmitter.emit(Events.StatusUpdated, status);
    }

    /**
     * @param {() => void} listener
     */
    onStatusUpdated(listener) {
        this.eventEmitter.on(Events.StatusUpdated, listener);
    }

    emitMqttConfigChanged() {
        this.eventEmitter.emit(Events.MqttConfigChanged);
    }

    /**
     * @param {() => void} listener
     */
    onMqttConfigChanged(listener) {
        this.eventEmitter.on(Events.MqttConfigChanged, listener);
    }
}

Events.MapUpdated = "MapUpdated";
Events.StatusUpdated = "StatusUpdated";
Events.MqttConfigChanged = "MqttConfigChanged";

module.exports = Events;
