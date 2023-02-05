const EventEmitter = require("events").EventEmitter;
const Tools = require("./Tools");

class ValetudoHelper {
    /**
     * The ValetudoHelper is sorta like the Tools class but with state
     * 
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.eventEmitter = new EventEmitter();


        this.config.onUpdate((key) => {
            if (key === "valetudo") {
                this.eventEmitter.emit(FRIENDLY_NAME_CHANGED);
            }
        });
    }

    hasFriendlyName() {
        const valetudoConfig = this.config.get("valetudo");

        return valetudoConfig.customizations.friendlyName !== "";
    }

    getFriendlyName() {
        const valetudoConfig = this.config.get("valetudo");

        if (this.hasFriendlyName()) {
            return valetudoConfig.customizations.friendlyName;
        } else {
            return `${this.robot.getModelName()} ${Tools.GET_HUMAN_READABLE_SYSTEM_ID()}`;
        }
    }

    /**
     * @public
     * @param {() => void} listener
     */
    onFriendlyNameChanged(listener) {
        this.eventEmitter.on(FRIENDLY_NAME_CHANGED, listener);
    }
}

const FRIENDLY_NAME_CHANGED = "FriendlyNameChanged";



module.exports = ValetudoHelper;
