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

    emitZonesChanged() {
        this.eventEmitter.emit(Events.ZonesChanged);
    }

    /**
     * @param {() => void} listener
     */
    onZonesChanged(listener) {
        this.eventEmitter.on(Events.ZonesChanged, listener);
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
Events.ZonesChanged = "ZonesChanged";
Events.StatusUpdated = "StatusUpdated";
Events.MqttConfigChanged = "MqttConfigChanged";

module.exports = Events;
