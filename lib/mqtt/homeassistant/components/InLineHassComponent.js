const HassComponent = require("./HassComponent");

class InLineHassComponent extends HassComponent {
    /**
     * @param {object} options
     * @param {import("../HassController")} options.hass
     * @param {import("../../../core/ValetudoRobot")} options.robot
     * @param {string} options.name
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
        this.autoconf = options.autoconf;
        this.topics = options.topics ?? null;
        if (options.baseTopicReference) {
            options.baseTopicReference.post(this.getBaseTopic()).then();
        }
    }

    getAutoconf() {
        return Object.assign(this.autoconf, {
            name: this.name
        });
    }

    getTopics() {
        return this.topics;
    }
}

module.exports = InLineHassComponent;