const HassComponent = require("./HassComponent");
const Logger = require("../../../Logger");

class InLineHassComponent extends HassComponent {
    /**
     * @param {object} options
     * @param {import("../HassController")} options.hass
     * @param {import("../../../core/ValetudoRobot")} options.robot
     * @param {string} options.name
     * @param {string} options.friendlyName
     * @param {string} options.componentType
     * @param {object} options.autoconf Inline autoconfig definition
     * @param {object} [options.topics] Optional inline published topics definition
     * @param {object} [options.baseTopicReference] Optional topic reference anchor to store the base topic
     */
    constructor(options) {
        super(Object.assign(options, {
            componentId: options.hass.identifier + "_" + options.componentType + "_" + options.name
        }));

        this.name = options.name;
        this.friendlyName = options.friendlyName;
        this.autoconf = options.autoconf;
        this.topics = options.topics ?? null;

        if (options.baseTopicReference) {
            options.baseTopicReference.post(this.getBaseTopic()).catch(err => {
                Logger.error("Error while posting value to HassAnchor", err);
            });
        }
    }

    /**
     * @public
     * @return {{[key: string]: any}}
     */
    getAutoconf() {
        return Object.assign(this.autoconf, {
            name: this.friendlyName,
            object_id: `${this.hass.objectId}_${this.friendlyName.toLowerCase().replace(/ /g, "_")}`
        });
    }

    getTopics() {
        return this.topics;
    }
}

module.exports = InLineHassComponent;
