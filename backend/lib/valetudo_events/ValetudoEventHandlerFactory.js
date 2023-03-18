const events = require("./events");
const handlers = require("./handlers");

class ValetudoEventHandlerFactory {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
    }

    /**
     *
     * @param {import("./events/ValetudoEvent")} event
     * @returns {import("./handlers/ValetudoEventHandler") | undefined}
     */
    getHandlerForEvent(event) {
        if (event instanceof events.DismissibleValetudoEvent) {
            return new handlers.DismissibleValetudoEventHandler({
                robot: this.robot,
                event: event
            });
        } else if (event instanceof events.ConsumableDepletedValetudoEvent) {
            return new handlers.ConsumableDepletedValetudoEventHandler({
                robot: this.robot,
                event: event
            });
        } else if (event instanceof events.PendingMapChangeValetudoEvent) {
            return new handlers.PendingMapChangeValetudoEventHandler({
                robot: this.robot,
                event: event
            });
        }
    }
}

module.exports = ValetudoEventHandlerFactory;
