const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const NodeMqttHandle = require("./NodeMqttHandle");
const PropertyMqttHandle = require("./PropertyMqttHandle");

class ValetudoEventsNodeMqttHandle extends NodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("./RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "ValetudoEvents",
            friendlyName: "Valetudo Events",
            type: "Events"
        }));

        this.robot = options.robot;
        this.valetudoEventStore = options.valetudoEventStore;


        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "valetudo_events",
                friendlyName: "Events",
                datatype: DataType.STRING,
                format: "json",
                getter: async () => {
                    const activeEvents = this.valetudoEventStore.getAll().filter(e => e.processed !== true);

                    await this.controller.hassAnchorProvider.getAnchor(
                        HassAnchor.ANCHOR.ACTIVE_VALETUDO_EVENTS_COUNT
                    ).post(activeEvents.length);

                    const out = {};
                    activeEvents.forEach(e => {
                        out[e.id] = e;
                    });

                    return out;
                },
                helpText: "This property contains all raised and not yet processed ValetudoEvents."
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: "ValetudoEvents",
                            friendlyName: "Events",
                            componentType: ComponentType.SENSOR,
                            baseTopicReference: this.controller.hassAnchorProvider.getTopicReference(
                                HassAnchor.REFERENCE.HASS_ACTIVE_VALETUDO_EVENTS
                            ),
                            autoconf: {
                                state_topic: this.controller.hassAnchorProvider.getTopicReference(
                                    HassAnchor.REFERENCE.HASS_ACTIVE_VALETUDO_EVENTS
                                ),
                                icon: "mdi:bell",
                                json_attributes_topic: prop.getBaseTopic(),
                                json_attributes_template: "{{ value }}"
                            },
                            topics: {
                                "": this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.ACTIVE_VALETUDO_EVENTS_COUNT
                                )
                            }
                        })
                    );
                });
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "valetudo_events/interact",
                friendlyName: "Interact with Events",
                datatype: DataType.STRING,
                format: "json",
                helpText: "Note that the interaction payload is event-specific, but for most use-cases, the example should be sufficient.\n\n" +
                    "Sample payload for a dismissible event (e.g. an ErrorStateValetudoEvent):\n\n" +
                    "```json\n" +
                    JSON.stringify({
                        id: "b89bd27c-5563-4cfd-87df-2f23e8bbeef7",
                        interaction: "ok"
                    }, null, 2) +
                    "\n```",
                setter: async (value) => {
                    let payload;
                    try {
                        payload = JSON.parse(value);
                    } catch (e) {
                        /* intentional */
                    }
                    if (!payload?.id || !payload?.interaction) {
                        Logger.warn("Received invalid valetudo_events/interact/set payload.");
                        return;
                    }

                    const event = this.valetudoEventStore.getById(payload.id);
                    if (!event) {
                        Logger.warn("Received valetudo_events/interact/set payload with invalid ID.");
                        return;
                    }

                    try {
                        await this.valetudoEventStore.interact(event, payload.interaction);
                    } catch (e) {
                        Logger.warn("Error while interacting with ValetudoEvent", e?.message ?? e);
                    }
                }
            })
        );
    }

    /**
     * Called by MqttController on any change to the ValetudoEventStore
     *
     * @public
     */
    onValetudoEventsUpdated() {
        if (this.controller.isInitialized) {
            this.refresh().catch(err => {
                Logger.error("Error during MQTT handle refresh", err);
            });
        }
    }
}

module.exports = ValetudoEventsNodeMqttHandle;
